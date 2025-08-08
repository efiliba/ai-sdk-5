import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  TextUIPart,
  consumeStream,
} from "ai";
import { after } from "next/server";
import Redis from "ioredis";

import { streamMockText } from "@/app/utils";
import { Message } from "@/types";
import {
  addChat,
  addMessage,
  appendStreamId,
  getChatMessages,
  getStreamIds,
  updateChatTitle,
} from "@/server/db/queries";

const redis = new Redis(process.env.REDIS_URL!);

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
      // If this is a new chat, send the chat ID to the front-end
      if (newChat) {
        writer.write({
          type: "data-new-chat-created",
          data: { chatId },
          transient: true, // Don't store this message in the chat history
        });
      }

      writer.write({
        id: "mock-text",
        type: "text-start",
      });

      await streamMockText((delta, accumulatedText) => {
        writer.write({
          id: "mock-text",
          type: "text-delta",
          delta,
        });

        redis.setex(`stream:${streamId}:partial`, 3600, accumulatedText);
      });

      writer.write({
        id: "mock-text",
        type: "text-end",
      });

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
      addMessage(chatId, responseMessage);
      redis.del(`stream:${streamId}:partial`);
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
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("id")!;

  const [chatMessages, streamIds] = await Promise.all([
    getChatMessages(chatId),
    getStreamIds(chatId),
  ]);

  // Use the most recent stream ID (first in the array since they're ordered by desc)
  const mostRecentStreamId = streamIds.at(0)!;

  console.log("9: ----------------> mostRecentStreamId", mostRecentStreamId);

  // Check if we have partial data in Redis for this stream
  const partialData = await redis.get(`stream:${mostRecentStreamId}:partial`);

  if (partialData) {
    console.log(
      "9: ------------------> Found partial data in Redis:",
      partialData
    );

    // Create a stream that continues from where it left off
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send the text-start event
        const startData = JSON.stringify({
          id: "mock-text",
          type: "text-start",
        });
        controller.enqueue(encoder.encode(`data: ${startData}\n\n`));

        // Send the existing partial data as a single text-delta event
        const deltaData = JSON.stringify({
          id: "mock-text",
          type: "text-delta",
          delta: partialData,
        });
        controller.enqueue(encoder.encode(`data: ${deltaData}\n\n`));

        // Now continue generating the rest of the stream
        let lastSentLength = partialData.length;

        // Poll for new data every 100ms
        const pollInterval = setInterval(async () => {
          try {
            const updatedPartialData = await redis.get(
              `stream:${mostRecentStreamId}:partial`
            );

            if (
              updatedPartialData &&
              updatedPartialData.length > lastSentLength
            ) {
              // Send only the new part
              const newDelta = updatedPartialData.slice(lastSentLength);
              const newDeltaData = JSON.stringify({
                id: "mock-text",
                type: "text-delta",
                delta: newDelta,
              });
              controller.enqueue(encoder.encode(`data: ${newDeltaData}\n\n`));
              lastSentLength = updatedPartialData.length;
            }

            // Check if the stream is complete (partial data was cleared)
            const isComplete = !(await redis.get(
              `stream:${mostRecentStreamId}:partial`
            ));
            if (isComplete) {
              // Send the text-end event
              const endData = JSON.stringify({
                id: "mock-text",
                type: "text-end",
              });
              controller.enqueue(encoder.encode(`data: ${endData}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              clearInterval(pollInterval);
            }
          } catch (error) {
            console.error("Error polling for stream updates:", error);
            clearInterval(pollInterval);
            controller.close();
          }
        }, 100);

        // Set a timeout to stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          controller.close();
        }, 5 * 60 * 1000);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } else {
    console.log(
      "9: ------------------> No partial data found in Redis for stream:",
      mostRecentStreamId
    );
  }

  // If no partial data, check if we have a complete message to return
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
