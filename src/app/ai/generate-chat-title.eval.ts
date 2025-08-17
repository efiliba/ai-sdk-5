import { Levenshtein } from "autoevals";
import { evalite } from "evalite";
import { reportTrace } from "evalite/traces";
import { generateChatTitle } from "./text-generators";
import { Message } from "@/types";

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
        completionTokens: result.usage.totalTokens!,
        promptTokens: result.usage.inputTokens!,
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
  ],
});
