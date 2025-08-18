import { generateText, generateObject, streamText } from "ai";
import { model, titleModel } from "./models";
import {
  titleSystemGenerator,
  titlePromptGenerator,
  clarificationSystemGenerator,
  clarificationSchema,
  clarificationRequestSystemGenerator,
  clarificationRequestPromptGenerator,
} from "./prompts";
import type { Message } from "@/types";
import { messagesToString } from "./utils";

export const generateChatTitle = (message: Message) =>
  generateText({
    model: titleModel,
    system: titleSystemGenerator(),
    prompt: titlePromptGenerator(message),
  });

export const checkIfQuestionNeedsClarification = async (
  messageHistory: string
) => {
  const { object, usage } = await generateObject({
    model,
    system: clarificationSystemGenerator(),
    schema: clarificationSchema(),
    prompt: messageHistory,
  });

  console.log("Usage:", usage);
  // // Report usage to system context
  // ctx.reportUsage("question-clarity-check", usage);

  return object;
};

export const generateClarificationRequest = async (
  messageHistory: string,
  reason: string
) => {
  const result = streamText({
    model,
    system: clarificationRequestSystemGenerator(),
    prompt: clarificationRequestPromptGenerator(messageHistory, reason),
  });

  // Report usage to system context when available
  // result.usage.then((usage) => {
  //   ctx.reportUsage("generate-clarification-request", usage);
  // });

  console.log("generateClarificationRequest result:", result);
  return result;
};
