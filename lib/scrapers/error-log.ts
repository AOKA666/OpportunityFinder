import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function writeErrorLog(
  filename: string,
  context: Record<string, unknown>,
  error: unknown,
): Promise<void> {
  const logsRoot =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? "/tmp/logs"
      : path.resolve(process.cwd(), "logs");
  const logsDirectory = path.resolve(logsRoot);
  await mkdir(logsDirectory, { recursive: true });

  const entry = {
    timestamp: new Date().toISOString(),
    ...context,
    error: error instanceof Error ? error.message : String(error),
  };

  await appendFile(
    path.join(logsDirectory, filename),
    `${JSON.stringify(entry)}\n`,
    "utf8",
  );
}
