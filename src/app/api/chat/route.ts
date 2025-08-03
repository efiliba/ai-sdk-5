import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  TextUIPart,
} from "ai";
import { after } from "next/server";
import Redis from "ioredis";

import { Message } from "@/types";
import { createResumableStreamContext } from "resumable-stream/redis";
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
  const { chatId, firstChat, message } = JSON.parse(await request.text()) as {
    chatId: string;
    firstChat: boolean;
    message: Message;
  };

  if (firstChat) {
    await addChat(chatId);
  }

  console.log(
    "3: --------------> POST request called:",
    // { isNewChat, chatId, firstChat },
    // id,
    chatId,
    firstChat,
    JSON.stringify(message)
  );

  await addMessage(chatId, message);

  // Record this stream ID for this chat to be able to resume it later
  await appendStreamId(chatId);

  const stream = createUIMessageStream<Message>({
    execute: async ({ writer }) => {
      // If this is a new chat, send the chat ID to the front-end
      if (firstChat) {
        writer.write({
          type: "data-new-chat-created",
          data: { chatId },
          transient: true, // Don't store this message in the chat history
        });
      }

      writer.write({
        id: "new-msg-id",
        type: "text-start",
      });

      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200));

        writer.write({
          id: "new-msg-id",
          type: "text-delta",
          delta: `${i}${(i + 1) % 10 === 0 ? "  \n" : " "}`,
        });
      }

      writer.write({
        id: "new-msg-id",
        type: "text-end",
      });

      if (firstChat) {
        const title = (message.parts[0] as TextUIPart).text;
        await updateChatTitle(chatId, title);

        writer.write({
          type: "data-title-updated",
          data: { title },
          transient: true,
        });
      }
    },
    onFinish: async (response) => {
      await addMessage(chatId, response.responseMessage);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occurred!";
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId")!;

  console.log("------------------> GET request called", chatId);

  const [chatMessages, streamIds] = await Promise.all([
    getChatMessages(chatId),
    getStreamIds(chatId),
  ]);
  console.log(
    "------------------>\n",
    "chatMessages",
    JSON.stringify(chatMessages),
    "\nstreamIds",
    JSON.stringify(streamIds)
  );

  const firstStreamId = streamIds.at(0)!;

  console.log("----------------> firstStreamId", firstStreamId);

  // Try to resume the existing stream using the resumable-stream library
  try {
    const resumedStream = await streamContext.resumableStream(
      firstStreamId,
      () => {
        // Fallback stream if resumption fails
        return new ReadableStream({
          start(controller) {
            controller.enqueue("data: [DONE]\n\n");
            controller.close();
          },
        });
      }
    );

    console.log("------------------> resumedStream", resumedStream);

    if (resumedStream) {
      console.log("--> Resumed stream:", firstStreamId);
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

  if (lastMessage?.role !== "assistant") {
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
