import { Levenshtein } from "autoevals";
import { evalite } from "evalite";
import { generateChatTitle } from "./text-generator";
import { Message } from "@/types";

evalite("Generate Chat Titles", {
  data: async () => [
    {
      input: `What's the capital of France?`,
      expected: `Capital of France`,
    },
  ],
  task: async (input) => {
    const message: Message = {
      id: "1",
      role: "user",
      parts: [{ type: "text", text: input }],
    };

    return generateChatTitle(message);
  },
  scorers: [Levenshtein], // Distance between 2 strings, from 0 to 1
});
