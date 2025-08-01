import { Chat, SideBar } from "./components";
import { getChatMessages } from "@/server/db/queries";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div className="flex h-screen bg-gray-950">
      <SideBar currentChatId={id} />
      <Chat
        // key={id}
        chatId={id ?? crypto.randomUUID()}
        initialMessages={await getChatMessages(id)}
      />
    </div>
  );
}
