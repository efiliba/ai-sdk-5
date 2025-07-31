"use client";

import { useEffect } from "react";
import type { Message } from "@/types";
import type { UseChatHelpers } from "@ai-sdk/react";

export interface Props {
  autoResume: boolean;
  initialMessages: Message[];
  setMessages: UseChatHelpers<Message>["setMessages"];
  chatId?: string;
}

export function useAutoResume({
  autoResume,
  initialMessages,
  setMessages,
  chatId,
}: Props) {
  useEffect(() => {
    console.log(
      "--------------> useAutoResume",
      autoResume,
      chatId,
      initialMessages
    );

    if (!autoResume || !chatId) return;

    const mostRecentMessage = initialMessages.at(-1);

    // Only attempt resumption if the last message is from user (indicating incomplete stream)
    if (mostRecentMessage?.role === "user") {
      // In AI SDK 5, we need to check for resumable streams via GET request
      const checkForResumableStream = async () => {
        try {
          const response = await fetch(`/api/chat?chatId=${chatId}`, {
            method: "GET",
          });

          if (response.ok && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") {
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    if (
                      parsed.type === "message" &&
                      parsed.message &&
                      parsed.message !== "mostRecentMessage"
                    ) {
                      // Only update messages if we got a real message, not the dummy one
                      setMessages([...initialMessages, parsed.message]);
                      return;
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Failed to check for resumable stream:", error);
        }
      };

      checkForResumableStream();
    }

    // we intentionally run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
