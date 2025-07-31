import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { Message } from "@/types";

export async function POST(request: Request) {
  const { messages, chatId, isNewChat } = JSON.parse(await request.text()) as {
    messages: Array<Message>;
    chatId: string;
    isNewChat: boolean;
  };

  const stream = createUIMessageStream<Message>({
    execute: async ({ writer }) => {
      // If this is a new chat, send the chat ID to the front-end
      if (isNewChat) {
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

      for (let i = 0; i < 100; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));

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
    },
    onFinish: async (response) => {
      // Merge the existing messages with the response messages
      console.log("--------------> onFinish", JSON.stringify(response));
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occurred!";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
