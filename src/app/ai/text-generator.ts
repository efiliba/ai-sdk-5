import { generateText } from "ai";
import { titleModel } from "./models";
import { titleSystemGenerator, titlePromptGenerator } from "./prompts";
import type { Message } from "@/types";

export const generateChatTitle = async (message: Message) => {
  const { text } = await generateText({
    model: titleModel,
    system: titleSystemGenerator(),
    prompt: titlePromptGenerator(message),
  });
  return text;
};
