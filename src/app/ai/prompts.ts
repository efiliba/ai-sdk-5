import { Message } from "@/types";
import { TextUIPart } from "ai";

export const titleSystemGenerator = () => `You are a chat title generator.
  You will be given the initial chat question, and you will need to generate a title for the chat.
  The title should be a single sentence that captures the essence of the chat.
  The title should be no more than 50 characters.
  The title should be in the same language as the chat history.
`;

export const titlePromptGenerator = (message: Message) =>
  `Here is the initial chat question:\n\n${
    (message.parts[0] as TextUIPart).text
  }`;
