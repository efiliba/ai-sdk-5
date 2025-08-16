import { Levenshtein } from "autoevals";
import { evalite, createScorer } from "evalite";
import { FactualityScorer } from "../evalite/factuality-scorer";

const customScorer = createScorer<string, string>({
  name: "Custom scorer",
  description: "Checks if the output contains 'Paris' or 'Berlin'.",
  scorer: ({ output }) =>
    output.includes("Paris") || output.includes("Berlin") ? 1 : 0,
});

evalite.experimental_skip("Test Capitals", {
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
        return "Not Berlin"; // Factuality 0%, but Levenshtein 60% and custom 100%
      default:
        return "Unknown";
    }
  },
  scorers: [FactualityScorer, customScorer, Levenshtein], // Distance between 2 strings, from 0 to 1
});
