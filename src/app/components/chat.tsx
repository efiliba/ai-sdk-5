"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";

import { Message } from "@/types";

interface Props {
  chatId: string;
  initialMessages: Message[];
}

export const Chat = ({ chatId, initialMessages }: Props) => {
  const router = useRouter();

  // console.log("2: CHAT RENDER -------------->", { chatId });

  const { messages, status, sendMessage } = useChat<Message>({
    id: chatId,
    resume: true,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            chatId,
            firstChat: messages.length === 1,
            message: messages.at(-1),
          },
        };
      },
      prepareReconnectToStreamRequest({ id }) {
        console.log("** Reconnect to stream **", id);
        return {
          api: `/api/chat?id=${chatId}`,
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
    }),
    messages: initialMessages,
    onData: ({ type, data }) => {
      switch (type) {
        case "data-new-chat-created":
          console.log("New chat created", data.chatId);
          router.push(`?id=${data.chatId}`);
          break;
        case "data-title-updated":
          console.log("Title updated", data.title);
          router.refresh(); // Refresh the sidebar to show the new title
          break;
      }
    },
  });

  const [input, setInput] = useState("");

  const handleSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    sendMessage({
      text: input,
      metadata: { test: "Send metadata to server on each message" },
    });

    setInput("");
  };

  // useAutoResume({
  //   autoResume: true,
  //   initialMessages,
  //   setMessages,
  //   chatId,
  // });

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
      </div>
    </div>
  );
};
