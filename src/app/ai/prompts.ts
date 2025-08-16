import { TextUIPart } from "ai";
import { z } from "zod";
import { Message } from "@/types";

export const titleSystemGenerator = () => `
  You are a chat title generator.
  You will be given the initial chat question, and you will need to generate a title for the chat.
  The title should be a single sentence that captures the essence of the chat.
  The title should be no more than 50 characters.
  The title should be in the same language as the chat history.
`;

export const titlePromptGenerator = (message: Message) =>
  `Here is the initial chat question:\n\n${
    (message.parts[0] as TextUIPart).text
  }`;

export const factualityPromptGenerator = (
  question: string,
  groundTruth: string,
  submission: string
) => `
  You are comparing a submitted answer to an expert answer on a given question. Here is the data:
  [BEGIN DATA]
  ************
  [Question]: ${question}
  ************
  [Expert]: ${groundTruth}
  ************
  [Submission]: ${submission}
  ************
  [END DATA]

  Compare the factual content of the submitted answer with the expert answer. Ignore any differences in style, grammar, or punctuation.
  The submitted answer may either be a subset or superset of the expert answer, or it may conflict with it. Determine which case applies.
  Answer the question by selecting one of the following options:
  (A) The submitted answer is a subset of the expert answer and is fully consistent with it.
  (B) The submitted answer is a superset of the expert answer and is fully consistent with it.
  (C) The submitted answer contains all the same details as the expert answer.
  (D) There is a disagreement between the submitted answer and the expert answer.
  (E) The answers differ, but these differences don't matter from the perspective of factuality.
`;

export const factualitySchema = () =>
  z.object({
    answer: z.enum(["A", "B", "C", "D", "E"]).describe("Your selection."),
    rationale: z
      .string()
      .describe("Why you chose this answer. Be very detailed."),
  });
