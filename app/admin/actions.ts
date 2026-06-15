"use server";

import { spawn } from "node:child_process";
import path from "node:path";

import { revalidatePath, updateTag } from "next/cache";

import type {
  PipelineActionState,
  PipelineName,
} from "@/app/admin/pipeline-types";
import { pick, type Locale } from "@/lib/i18n-shared";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { ReviewStatus } from "@/lib/types/database";

const REVIEW_STATUSES = new Set<ReviewStatus>(["keep", "watch", "pass"]);

interface PipelineJob {
  label: string;
  script: string;
  args: string[];
}

const PIPELINES: Record<
  PipelineName,
  {
    jobs: PipelineJob[];
    successMessage: [string, string];
  }
> = {
  collection: {
    jobs: [
      {
        label: "Product Hunt",
        script: "scripts/fetch-producthunt.ts",
        args: ["--limit", "100", "--days", "90"],
      },
      {
        label: "Futurepedia",
        script: "scripts/fetch-futurepedia.ts",
        args: ["--limit", "100"],
      },
    ],
    successMessage: [
      "Product Hunt and Futurepedia collection completed.",
      "Product Hunt 和 Futurepedia 采集完成。",
    ],
  },
  enrichment: {
    jobs: [
      {
        label: "AI enrichment",
        script: "scripts/enrich-product-patterns.ts",
        args: ["--limit", "20"],
      },
    ],
    successMessage: ["Product enrichment completed.", "产品模式分析完成。"],
  },
  opportunities: {
    jobs: [
      {
        label: "Opportunity generation",
        script: "scripts/generate-opportunities.ts",
        args: ["--limit", "10"],
      },
    ],
    successMessage: ["Opportunity generation completed.", "机会生成完成。"],
  },
};

function isPipelineName(value: string): value is PipelineName {
  return value in PIPELINES;
}

function runScript(script: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const root = process.cwd();
    const tsxCli = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "node_modules",
      "tsx",
      "dist",
      "cli.mjs",
    );
    const scriptPath = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      script,
    );
    const child = spawn(
      process.execPath,
      [tsxCli, scriptPath, ...args],
      {
        cwd: root,
        env: process.env,
        windowsHide: true,
      },
    );
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(
        new Error(
          output || `${script} exited with code ${code ?? "unknown"}.`,
        ),
      );
    });
  });
}

class PipelineRunError extends Error {
  constructor(
    message: string,
    readonly output: string,
  ) {
    super(message);
  }
}

async function runJobs(jobs: PipelineJob[]): Promise<string> {
  const results = await Promise.allSettled(
    jobs.map(async (job) => ({
      label: job.label,
      output: await runScript(job.script, job.args),
    })),
  );
  const sections = results.map((result, index) => {
    const label = jobs[index].label;
    if (result.status === "fulfilled") {
      return `=== ${label} ===\n${result.value.output || "Completed."}`;
    }

    const message =
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
    return `=== ${label} (failed) ===\n${message}`;
  });
  const failureCount = results.filter(
    (result) => result.status === "rejected",
  ).length;

  if (failureCount > 0) {
    throw new PipelineRunError(
      `${failureCount} of ${jobs.length} jobs failed.`,
      sections.join("\n\n"),
    );
  }

  return sections.join("\n\n");
}

export async function runPipeline(
  _previousState: PipelineActionState,
  formData: FormData,
): Promise<PipelineActionState> {
  const pipeline = String(formData.get("pipeline") ?? "");
  const locale: Locale = formData.get("locale") === "zh" ? "zh" : "en";
  if (!isPipelineName(pipeline)) {
    return {
      status: "error",
      pipeline: null,
      message: pick(locale, "Unknown pipeline.", "未知的流水线任务。"),
      output: "",
      completedAt: new Date().toISOString(),
    };
  }

  const config = PIPELINES[pipeline];

  try {
    const jobs = config.jobs.map((job) => ({
      ...job,
      args:
        pipeline === "opportunities"
          ? [...job.args, "--locale", locale]
          : job.args,
    }));
    const output = await runJobs(jobs);
    updateTag("admin-product-list");
    revalidatePath("/admin/products");
    revalidatePath("/admin/opportunities");

    return {
      status: "success",
      pipeline,
      message: pick(locale, ...config.successMessage),
      output,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      pipeline,
      message:
        error instanceof PipelineRunError
          ? pick(
              locale,
              "Some sources failed. Check the run output.",
              "部分来源采集失败，请查看运行输出。",
            )
          : error instanceof Error
            ? error.message
            : pick(locale, "Pipeline failed.", "流水线执行失败。"),
      output: error instanceof PipelineRunError ? error.output : "",
      completedAt: new Date().toISOString(),
    };
  }
}

export async function saveReviewLabel(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const status = String(formData.get("status") ?? "") as ReviewStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!productId || !REVIEW_STATUSES.has(status)) {
    throw new Error("A valid product and review status are required.");
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("review_labels").insert({
    product_id: productId,
    status,
    note,
  });

  if (error) {
    throw new Error(`Unable to save review: ${error.message}`);
  }

  updateTag("admin-product-list");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
}
