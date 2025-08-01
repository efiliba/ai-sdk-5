import { eq, and, desc, max, count } from "drizzle-orm";

import { db } from ".";
import { chats, messages, streams } from "./schema";
import type { Message } from "@/types";

export const addChat = async (id: string) =>
  await db.insert(chats).values({ id, title: "Generating..." });

export const updateChat = async (id: string, title: string) =>
  await db.update(chats).set({ title }).where(eq(chats.id, id));

export const addMessage = async (
  chatId: string,
  { id, role, parts, metadata }: Message
) => {
  const [{ count: order }] = await db
    .select({ count: count() })
    .from(messages)
    .where(eq(messages.chatId, chatId));

  return await db.insert(messages).values({
    id,
    chatId,
    role,
    parts,
    order,
    metadata,
  });
};

export const upsertChat = async ({
  chatId,
  title = "",
  messages: newMessages,
}: {
  chatId: string;
  title?: string;
  messages: Message[];
}) => {
  // First, check if the chat exists and belongs to the user
  const existingChat = await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
  });

  if (existingChat) {
    // Delete all existing messages
    await db.delete(messages).where(eq(messages.chatId, chatId));
    // Optionally update the title if provided
    if (title) {
      await db.update(chats).set({ title }).where(eq(chats.id, chatId));
    }
  } else {
    // Create new chat
    await db.insert(chats).values({ id: chatId, title });
  }

  // Insert all messages
  await db.insert(messages).values(
    newMessages.map(({ role, parts }, index) => ({
      id: crypto.randomUUID(),
      chatId,
      role,
      parts,
      order: index,
    }))
  );

  if (title) {
    await db.update(chats).set({ title }).where(eq(chats.id, chatId));
  }

  return { id: chatId };
};

export const getChatMessages = async (id?: string) => {
  if (!id) {
    return [];
  }

  const chatMessages = await db.query.messages.findMany({
    where: eq(messages.chatId, id),
    orderBy: (messages, { asc }) => [asc(messages.order)],
  });

  return chatMessages.map(
    ({ id, role, parts, metadata }) =>
      ({
        id,
        role,
        parts,
        metadata,
      } as Message)
  );
};

// export const getChats = async ({ userId }: { userId: string }) =>
//   await db.query.chats.findMany({
//     where: eq(chats.userId, userId),
//     orderBy: (chats, { desc }) => [desc(chats.updatedAt)],
//   });

export const appendStreamId = async (chatId: string) =>
  await db.insert(streams).values({
    chatId,
  });

// Get all the stream IDs for a given chat
export const getStreamIds = async (chatId: string) =>
  (
    await db.query.streams.findMany({
      where: eq(streams.chatId, chatId),
      orderBy: (streams, { desc }) => [desc(streams.createdAt)],
    })
  ).map(({ id }) => id);
