"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { Message } from "@/types";
import { useAutoResume } from "./use-auto-resume";

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
      if (type === "data-new-chat-created") {
        router.push(`?id=${data.chatId}`);
      }
    },
  });

  const handleSendMessage = () => {
    // console.log("3: SEND MESSAGE TO SERVER -------------->");
    sendMessage({
      text: "Hello",
      metadata: { test: "Send metadata to server on each message" },
    });
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
    <div className="font-sans grid items-center justify-items-center p-8 gap-10">
      <button
        onClick={handleSendMessage}
        className="bg-blue-500 text-white p-2 rounded-md"
      >
        Send Message
      </button>
      <div>Status: {status}</div>
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
  );
};
