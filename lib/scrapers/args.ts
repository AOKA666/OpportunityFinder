export interface CommonScriptArgs {
  limit: number;
  dryRun: boolean;
}

export function parseCommonArgs(
  argv: string[],
  defaults: { limit: number },
): CommonScriptArgs {
  let limit = defaults.limit;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (argument === "--limit") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("--limit must be a positive integer");
      }
      limit = value;
      index += 1;
    }
  }

  return { limit, dryRun };
}
