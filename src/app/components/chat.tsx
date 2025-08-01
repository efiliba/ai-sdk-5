"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { Message } from "@/types";
import { useAutoResume } from "../use-auto-resume";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  chatId: string;
  initialMessages: Message[];
}

export const Chat = ({ chatId, initialMessages }: Props) => {
  const router = useRouter();

  // console.log("2: CHAT RENDER -------------->", { chatId });

  const { messages, status, sendMessage, setMessages } = useChat<Message>({
    id: chatId, // Need a unique id for each chat
    transport: new DefaultChatTransport({
      body: {
        chatId,
      },
    }),
    messages: initialMessages,
    onData: ({ type, data }) => {
      switch (type) {
        case "data-new-chat-created":
          router.push(`?id=${data.chatId}`);
          break;
        case "data-title-updated":
          console.log("------------------> data-title-updated", data.title);
          break;
      }
    },
  });

  const [input, setInput] = useState("Some message");

  const count = useRef(1);
  const handleSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    sendMessage({
      text: input,
      metadata: { test: "Send metadata to server on each message" },
    });

    setInput(`Some message ${count.current++}`);
  };

  useAutoResume({
    autoResume: true,
    initialMessages,
    setMessages,
    chatId,
  });

  // console.log(
  //   "--------------> chat:initialMessages",
  //   JSON.stringify(initialMessages)
  // );
  return (
    <div className="flex flex-1 flex-col">
      <div
        className="mx-auto w-full max-w-[65ch] flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500"
        role="log"
        aria-label="Chat messages"
      >
        <div>Status: {status}</div>
        <form
          onSubmit={handleSubmitMessage}
          className="mx-auto max-w-[65ch] p-4"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something..."
              autoFocus
              aria-label="Chat input"
              className="flex-1 rounded border border-gray-700 bg-gray-800 p-2 text-gray-200 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "streaming"}
              className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:hover:bg-gray-700"
            >
              {status === "streaming" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </form>
        <div>
          {messages.map(({ id, role, parts, metadata }) => (
            <div key={id} className="border-1 border-gray-300 p-2 m-2">
              Message:
              <div>
                <div>ID: {id}</div>
                <div>Role: {role}</div>
                <pre>Metadata: {JSON.stringify(metadata, null, 2)}</pre>
                {parts.map((part, index) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <div key={index} className="whitespace-pre-wrap">
                          {part.text}
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700"></div>
      </div>
    </div>
  );
};
