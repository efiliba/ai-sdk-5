"use server";

import Redis from "ioredis";
import { clearAllChats } from "@/server/db/queries";

const redis = new Redis(process.env.REDIS_URL!);

export async function clearRedis() {
  try {
    const keys = await redis.keys("*");

    const pipeline = redis.pipeline();
    keys.forEach((key) => pipeline.del(key));
    await pipeline.exec();

    return {
      success: true,
      message: "Redis cleared successfully",
      clearedKeys: keys.length,
      keys: keys,
    };
  } catch (error) {
    console.error("Error clearing Redis:", error);
    return {
      success: false,
      error: "Failed to clear Redis data",
    };
  }
}

export async function clearAllChatsAction() {
  return await clearAllChats();
}
