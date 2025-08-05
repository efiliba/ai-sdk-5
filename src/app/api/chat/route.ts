import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  TextUIPart,
  consumeStream,
} from "ai";
import { after } from "next/server";
import Redis from "ioredis";

import { generateStream } from "@/app/utils";
import { Message } from "@/types";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import {
  addChat,
  addMessage,
  appendStreamId,
  getChatMessages,
  getStreamIds,
  updateChatTitle,
} from "@/server/db/queries";

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

  // Record this stream ID for this chat to be able to resume it later
  const streamId = await appendStreamId(chatId);
  console.log("4: ------------------> streamId saved in db", streamId);

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

      await generateStream(writer);

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
    onFinish: async ({ responseMessage }) => {
      await addMessage(chatId, responseMessage);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occurred!";
    },
  });

  return createUIMessageStreamResponse({
    stream,
    consumeSseStream: consumeStream,
  });
}

export async function GET(request: Request) {
  // https://ai-sdk.dev/docs/advanced/caching

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("id")!;

  console.log("9: ******* ------------------> GET request called", chatId);

  const [chatMessages, streamIds] = await Promise.all([
    getChatMessages(chatId),
    getStreamIds(chatId),
  ]);
  console.log(
    "9: ------------------>\n",
    "chatMessages",
    JSON.stringify(chatMessages),
    "\nstreamIds",
    JSON.stringify(streamIds)
  );

  const firstStreamId = streamIds.at(0)!;

  console.log("9: ----------------> firstStreamId", firstStreamId);

  // Try to resume the existing stream using the resumable-stream library
  try {
    const resumedStream = await streamContext.resumableStream(
      firstStreamId,
      () => {
        console.log(
          "9: ------------------> Fallback stream if resumption fails USED"
        );
        // Fallback stream if resumption fails
        return new ReadableStream({
          start(controller) {
            controller.enqueue("data: [DONE]\n\n");
            controller.close();
          },
        });
      }
    );

    console.log("9: ------------------> resumedStream", resumedStream);

    if (resumedStream) {
      console.log("9: SUCCESS --> Resumed stream:", firstStreamId);
      return new Response(resumedStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch (error) {
    console.error("Failed to resume stream:", error);
  }

  // If resumption fails, check if we have a complete message to return
  const lastMessage = chatMessages.at(-1);

  if (!lastMessage || lastMessage.role !== "assistant") {
    return new Response("", { status: 200 });
  }

  // Create a simple SSE stream with the last message
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send the message as a data event
      const messageData = JSON.stringify({
        type: "message",
        message: lastMessage,
      });

      controller.enqueue(encoder.encode(`data: ${messageData}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
