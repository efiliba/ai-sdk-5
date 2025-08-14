import { UIMessage } from "ai";

export type Message = UIMessage<
  { data: string },
  {
    "new-chat-created": {
      chatId: string;
    };
    "clarification-request": {
      reason: string;
    };
    usage: {
      totalTokens: number;
    };
    "title-updated": {
      title: string;
    };
    "append-message": {
      message: UIMessage;
    };
  }
>;
