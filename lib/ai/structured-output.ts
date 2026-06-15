import { z } from "zod";

import { getAIClient, getAIModel } from "@/lib/ai/client";

interface StructuredCompletionInput<T extends z.ZodType> {
  schema: T;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
}

export async function createStructuredCompletion<T extends z.ZodType>({
  schema,
  schemaName,
  systemPrompt,
  userPrompt,
}: StructuredCompletionInput<T>): Promise<z.infer<T>> {
  const response = await getAIClient().chat.completions.create({
    model: getAIModel(),
    messages: [
      {
        role: "system",
        content: `${systemPrompt}

Return only a valid JSON object matching this JSON Schema:
${JSON.stringify(z.toJSONSchema(schema), null, 2)}`,
      },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error(`${schemaName} returned no JSON content`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`${schemaName} returned invalid JSON`, { cause: error });
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `${schemaName} returned an invalid structure: ${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}
