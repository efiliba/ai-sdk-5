import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Chat } from "./chat";
import { getChatMessages } from "@/server/db/queries";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  // if (!id) {
  //   console.log("PAGE --------------> id is undefined");
  // } else {
  //   console.log("PAGE --------------> id DEFINED");
  // }
  const chatId = id ?? crypto.randomUUID();
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
        key={id}
        chatId={chatId}
        isNewChat={!id}
        initialMessages={await getChatMessages(id)}
      />
    </div>
  );
}
