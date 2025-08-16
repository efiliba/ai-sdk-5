import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  consumeStream,
  // type TextUIPart,
} from "ai";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { after } from "next/server";
import Redis from "ioredis";

import { convertToReadableStringStream, streamMockText } from "@/app/utils";
import type { Message } from "@/types";
import {
  addChat,
  addMessage,
  appendStreamId,
  getChatMessages,
  getStreamIds,
  updateChatTitle,
} from "@/server/db/queries";
import { generateChatTitle } from "@/app/ai/textGenerator";

const streamContext = createResumableStreamContext({
  waitUntil: after,
  publisher: new Redis(process.env.REDIS_URL!),
  subscriber: new Redis(process.env.REDIS_URL!),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  const { chatId, newChat, message } = JSON.parse(await request.text()) as {
    chatId: string;
    newChat: boolean;
    message: Message;
  };

  if (newChat) {
    await addChat(chatId);
  }

  await addMessage(chatId, message);

  // Record stream ID to be able to resume this chat
  const streamId = await appendStreamId(chatId);

  const stream = createUIMessageStream<Message>({
    execute: async ({ writer }) => {
      let titlePromise = Promise.resolve("");

      // If this is a new chat, send the chat ID to the front-end
      if (newChat) {
        writer.write({
          type: "data-new-chat-created",
          data: { chatId },
          transient: true, // Don't store this message in the chat history
        });

        titlePromise = generateChatTitle(message);
      }

      const [title] = await Promise.all([titlePromise, streamMockText(writer)]);

      if (newChat) {
        await updateChatTitle(chatId, title);

        writer.write({
          type: "data-title-updated",
          data: { title },
          transient: true,
        });
      }
    },
    onFinish: ({ responseMessage }) => {
      addMessage(chatId, responseMessage);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occurred!";
    },
  });

  return new Response(
    await streamContext.resumableStream(streamId, () => {
      const response = createUIMessageStreamResponse({
        stream,
        consumeSseStream: consumeStream,
      });
      return convertToReadableStringStream(response.body!);
    })
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("id")!;

  const [chatMessages, streamIds] = await Promise.all([
    getChatMessages(chatId),
    getStreamIds(chatId),
  ]);

  // Use the most recent stream ID
  const mostRecentStreamId = streamIds.at(0);
  if (!mostRecentStreamId) {
    return new Response(null, { status: 204 });
  }

  const stream = await streamContext.resumableStream(
    mostRecentStreamId,
    () =>
      new ReadableStream<string>({
        start: () => {}, // Empty stream for resumable context
      })
  );

  // Return stream in a new response if ongoing
  if (stream) {
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Else find the most recent message
  const streamWithMessage = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({
        type: "data-append-message",
        data: { chatId, message: chatMessages.at(-1) },
      });
    },
  });

  return createUIMessageStreamResponse({ stream: streamWithMessage });
}
