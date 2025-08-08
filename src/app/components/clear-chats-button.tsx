"use client";

import { Trash2Icon } from "lucide-react";
import { clearAllChatsAction } from "@/app/actions";
import { cn } from "@/app/utils";

export const ClearChatsButton = ({
  className,
  onClearChats,
}: {
  className?: string;
  onClearChats: () => void;
}) => {
  const handleClear = async () => {
    await clearAllChatsAction();
    onClearChats();
  };

  return (
    <button
      onClick={handleClear}
      className={cn(
        "grid grid-cols-[min-content_1fr] gap-x-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors items-center justify-items-start",
        className
      )}
      title="Clear All Chats"
    >
      <Trash2Icon className="size-4" />
      Clear All
    </button>
  );
};
