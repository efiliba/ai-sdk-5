import { UIMessage } from "ai";

export type Message = UIMessage<
  { test: string },
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
  }
>;
