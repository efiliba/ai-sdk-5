import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { getChats } from "@/server/db/queries";
import { ClearChatsButton } from "./clear-chats-button";

export const SideBar = async ({
  currentChatId,
}: {
  currentChatId?: string;
}) => {
  const chats = await getChats();

  return (
    <div className="grid grid-rows-[min-content_1fr] w-64 border-r border-gray-700 bg-gray-900">
      <div className="p-4 grid grid-cols-2 grid-rows-[min-content_min-content] gap-y-4 items-center">
        <ClearChatsButton className="col-span-2" />
        <h2 className="text-sm font-semibold text-gray-400">Your Chats</h2>
        <Link
          href="/"
          className="grid size-8 items-center justify-items-center justify-self-end rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          title="New Chat"
        >
          <PlusIcon className="size-5" />
        </Link>
      </div>
      <div className="grid grid-auto-rows-min space-y-2 overflow-y-auto px-4 pt-1 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/?id=${chat.id}`}
              className={`rounded-lg p-3 text-left text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                chat.id === currentChatId
                  ? "bg-gray-700"
                  : "hover:bg-gray-750 bg-gray-800"
              }`}
            >
              {chat.title}
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No chats yet. Start a new conversation!
          </p>
        )}
      </div>
    </div>
  );
};
