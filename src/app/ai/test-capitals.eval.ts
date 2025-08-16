import { Levenshtein } from "autoevals";
import { evalite, createScorer } from "evalite";

const customScorer = createScorer<string, string>({
  name: "Custom scorer",
  description: "Checks if the output contains 'Paris' or 'Berlin'.",
  scorer: ({ output }) =>
    output.includes("Paris") || output.includes("Berlin") ? 1 : 0,
});

evalite("Test Capitals", {
  data: async () => [
    {
      input: `What's the capital of France?`,
      expected: `Paris`,
    },
    {
      input: `What's the capital of Germany?`,
      expected: `Berlin`,
    },
  ],
  task: (input) => {
    switch (true) {
      case input.includes("France"):
        return "It's Paris.";
      case input.includes("Germany"):
        return "Berlin!";
      default:
        return "Unknown";
    }
  },
  scorers: [customScorer, Levenshtein], // Distance between 2 strings, from 0 to 1
});
