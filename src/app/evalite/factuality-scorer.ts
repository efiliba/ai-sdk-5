import { createScorer } from "evalite";
import { generateObject } from "ai";
import { factualityModel } from "../ai/models";
import { factualityPromptGenerator, factualitySchema } from "../ai/prompts";

export const checkFactuality = async (opts: {
  question: string;
  groundTruth: string;
  submission: string;
}) => {
  const { object } = await generateObject({
    model: factualityModel,
    prompt: factualityPromptGenerator(
      opts.question,
      opts.groundTruth,
      opts.submission
    ),
    schema: factualitySchema(),
  });

  const scores = {
    A: 0.4,
    B: 0.6,
    C: 1,
    D: 0,
    E: 1,
  };

  return {
    score: scores[object.answer],
    metadata: {
      rationale: object.rationale,
    },
  };
};

export const FactualityScorer = createScorer<string, string, string>({
  name: "Factuality",
  scorer: ({ input, expected, output }) => {
    return checkFactuality({
      question: input,
      groundTruth: expected!,
      submission: output,
    });
  },
});
