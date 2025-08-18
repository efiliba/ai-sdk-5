import { Levenshtein } from "autoevals";
import { evalite } from "evalite";
import { reportTrace } from "evalite/traces";
import { generateChatTitle } from "./text-generators";
import { Message } from "@/types";

let usage: { inputTokens?: number; outputTokens?: number };

evalite("Generate Chat Titles", {
  data: () => [
    {
      input: "What's the capital of France?",
      expected: "Capital of France",
    },
  ],
  task: async (input) => {
    const message: Message = {
      id: "1",
      role: "user",
      parts: [{ type: "text", text: input }],
    };

    const start = performance.now();

    const result = await generateChatTitle(message);
    usage = result.usage; // store usage to display in results

    reportTrace({
      start,
      end: performance.now(),
      output: result.text,
      input: [
        {
          role: "user",
          content: input,
        },
      ],
      usage: {
        promptTokens: result.usage.inputTokens!,
        completionTokens: result.usage.outputTokens!,
      },
    });

    return result.text;
  },
  scorers: [Levenshtein], // Distance between 2 strings, from 0 to 1
  columns: ({ input, expected, output }) => [
    {
      label: "Input",
      value: input,
    },
    {
      label: "Expected",
      value: expected,
    },
    {
      label: "Output",
      value: output,
    },
    {
      label: "Tokens",
      value: JSON.stringify(usage),
    },
  ],
});
