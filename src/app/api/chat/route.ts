import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  consumeStream,
  type TextUIPart,
  // createDataStream,
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

const redis = new Redis(process.env.REDIS_URL!);

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
  console.log("8: ----------------> create streamId:", streamId);

  const stream = createUIMessageStream<Message>({
    execute: async ({ writer }) => {
      // If this is a new chat, send the chat ID to the front-end
      if (newChat) {
        writer.write({
          type: "data-new-chat-created",
          data: { chatId },
          transient: true, // Don't store this message in the chat history
        });
      }

      await streamMockText(writer);

      if (newChat) {
        const title = (message.parts[0] as TextUIPart).text;
        await updateChatTitle(chatId, title);

        writer.write({
          type: "data-title-updated",
          data: { title },
          transient: true,
        });
      }
    },
    onFinish: ({ responseMessage }) => {
      console.log("8: ----------------> delete streamId:", streamId);
      addMessage(chatId, responseMessage);
      redis.del(`resumable-stream:rs:sentinel:${streamId}`);
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

  // Use the most recent stream ID (first in the array since they're ordered by desc)
  const mostRecentStreamId = streamIds.at(0)!;

  console.log("9: ----------------> mostRecentStreamId", mostRecentStreamId);

  // Creates a readable stream if ongoing
  const stream = await streamContext.resumableStream(
    mostRecentStreamId,
    () =>
      new ReadableStream<string>({
        start() {
          // Empty stream for resumable context
        },
      })
  );

  console.log("9: ----------------> stream FOUND", stream);

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

  console.log("9: ----------------> FIND THE MOST RESENT MESSAGE", stream);

  // Else find the most recent message
  const streamWithMessage = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({
        type: "data-append-message",
        data: "test", //{ chatId, message: chatMessages.at(-1) },
      });
    },
  });

  return createUIMessageStreamResponse({
    stream: streamWithMessage,
    consumeSseStream: consumeStream,
  });
}
