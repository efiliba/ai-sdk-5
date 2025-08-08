"use client";

import { useRef } from "react";

import { ChatMenu } from "./chat-menu";
import { ChatWindow } from "./chat-window";
import { Chat } from "@/server/db/schema";
import { Message } from "@/types";

export const Chats = ({
  chatId,
  chats,
  initialMessages,
}: {
  chatId?: string;
  chats: Chat[];
  initialMessages: Message[];
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClearChats = () => {
    window.location.reload();
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="grid grid-cols-[250px_1fr] h-screen bg-gray-950">
      <ChatMenu
        currentChatId={chatId}
        chats={chats}
        onClearChats={handleClearChats}
        onNewChat={handleNewChat}
      />
      <ChatWindow
        inputRef={inputRef}
        chatId={chatId ?? crypto.randomUUID()}
        initialMessages={initialMessages}
      />
    </div>
  );
};
