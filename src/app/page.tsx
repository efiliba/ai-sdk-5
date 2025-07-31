import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Chat } from "./chat";
import { Message } from "@/types";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const initialMessages: Message[] = []; // Get messages from db

  return (
    <div className="font-sans grid items-center justify-items-center p-8 gap-10">
      <Link
        href="/"
        className="flex size-8 items-center justify-center rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        title="New Chat"
      >
        <PlusIcon className="size-5" />
      </Link>
      <Chat
        chatId={id ?? crypto.randomUUID()}
        isNewChat={id === undefined}
        initialMessages={initialMessages}
      />
    </div>
  );
}
