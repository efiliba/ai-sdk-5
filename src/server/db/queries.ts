import { eq, count } from "drizzle-orm";

import { db } from ".";
import { chats, messages, streams } from "./schema";
import type { Message } from "@/types";

export const addChat = async (id: string) =>
  await db.insert(chats).values({ id, title: "Generating..." });

export const updateChatTitle = async (id: string, title: string) =>
  await db.update(chats).set({ title }).where(eq(chats.id, id));

export const addMessage = async (
  chatId: string,
  { role, parts, metadata }: Omit<Message, "id">
) => {
  const [{ count: order }] = await db
    .select({ count: count() })
    .from(messages)
    .where(eq(messages.chatId, chatId));

  return await db.insert(messages).values({
    chatId,
    role,
    parts,
    order,
    metadata,
  });
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

export const getChats = async () =>
  await db.query.chats.findMany({
    orderBy: (chats, { desc }) => [desc(chats.updatedAt)],
  });

export const appendStreamId = async (chatId: string) => {
  const [result] = await db
    .insert(streams)
    .values({
      chatId,
    })
    .returning({ id: streams.id });

  return result.id;
};

// Get all the stream IDs for a given chat
export const getStreamIds = async (chatId: string) =>
  (
    await db.query.streams.findMany({
      where: eq(streams.chatId, chatId),
      orderBy: (streams, { desc }) => [desc(streams.createdAt)],
    })
  ).map(({ id }) => id);

export const clearAllChats = async () => {
  await db.delete(messages);
  await db.delete(streams);
  await db.delete(chats);
};
