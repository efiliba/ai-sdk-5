import { UIMessage } from "ai";

export type Message = UIMessage<
  { data: string },
  {
    "new-chat-created": {
      chatId: string;
    };
    // "new-action": Action;
    // sources: Source[];
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
      message: string;
    };
  }
>;
