import { Chats } from "@/app/components/chats";
import { getChatMessages, getChats } from "@/server/db/queries";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <Chats
      chatId={id}
      chats={await getChats()}
      initialMessages={await getChatMessages(id)}
    />
  );
}
