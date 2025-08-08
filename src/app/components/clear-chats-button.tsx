"use client";

import { Trash2Icon } from "lucide-react";
import { clearAllChatsAction } from "@/app/actions";

export const ClearChatsButton = () => {
  const handleClear = async () => {
    await clearAllChatsAction();
    window.location.reload();
  };

  return (
    <button
      onClick={handleClear}
      className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
      title="Clear All Chats"
    >
      <Trash2Icon className="size-4" />
      Clear All
    </button>
  );
};
