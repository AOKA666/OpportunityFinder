import OpenAI from "openai";

let openaiClient: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Configure it before running AI scripts.",
    );
  }

  openaiClient ??= new OpenAI({ apiKey });
  return openaiClient;
}
