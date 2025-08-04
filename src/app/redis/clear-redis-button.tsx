"use client";

import { clearRedis } from "./actions";

export const ClearRedisButton = () => {
  const handleClear = async () => {
    const result = await clearRedis();

    if (result.success) {
      console.log(
        `Redis cleared successfully! Removed ${result.clearedKeys} keys.`
      );
      window.location.reload();
    } else {
      console.log(`Failed to clear Redis data: ${result.error}`);
    }
  };

  return (
    <button
      onClick={handleClear}
      className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded font-medium transition-colors"
    >
      Clear All Redis Data
    </button>
  );
};
