import OpenAI from "openai";

const DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
const DEFAULT_MODEL = "glm-5.1";

let aiClient: OpenAI | undefined;

export function getAIModel(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

export function getAIClient(): OpenAI {
  const apiKey =
    process.env.BIGMODEL_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing BIGMODEL_API_KEY. Configure it before running AI scripts.",
    );
  }

  aiClient ??= new OpenAI({
    apiKey,
    baseURL: process.env.AI_BASE_URL || DEFAULT_BASE_URL,
  });
  return aiClient;
}
