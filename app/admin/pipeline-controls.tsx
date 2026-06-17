"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { runPipeline } from "@/app/admin/actions";
import {
  INITIAL_PIPELINE_STATE,
  type PipelineActionState,
  type PipelineName,
} from "@/app/admin/pipeline-types";
import { pick, type Locale } from "@/lib/i18n-shared";

const PIPELINES: Array<{
  name: PipelineName;
  label: [string, string];
  pendingLabel: [string, string];
}> = [
  {
    name: "collection",
    label: ["Collect products", "采集产品"],
    pendingLabel: [
      "Fetching Product Hunt and Futurepedia in parallel",
      "正在并行抓取 Product Hunt 和 Futurepedia",
    ],
  },
  {
    name: "enrichment",
    label: ["Enrich patterns", "分析产品模式"],
    pendingLabel: ["Analyzing product patterns with AI", "正在使用 AI 分析产品模式"],
  },
  {
    name: "opportunities",
    label: ["Generate opportunities", "生成机会"],
    pendingLabel: ["Clustering evidence and generating opportunities", "正在聚类产品证据并生成机会"],
  },
];

function RunningStatus({
  label,
  locale,
}: {
  label: string;
  locale: Locale;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p
      className="mt-1 flex items-center gap-2 text-xs"
      role="status"
      aria-live="polite"
    >
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-200/30 border-t-[#d9ff62]" />
      {label}。{pick(locale, `Elapsed ${elapsedSeconds}s.`, `已用时 ${elapsedSeconds} 秒。`)}
    </p>
  );
}

function PipelineFormContent({
  activePipeline,
  state,
  locale,
}: {
  activePipeline: PipelineName | null;
  state: PipelineActionState;
  locale: Locale;
}) {
  const { pending } = useFormStatus();
  const activeConfig = PIPELINES.find(
    (pipeline) => pipeline.name === activePipeline,
  );

  return (
    <>
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/60">
            {pick(locale, "Data pipeline", "数据流水线")}
          </p>
          {pending && activeConfig ? (
            <RunningStatus
              label={pick(locale, ...activeConfig.pendingLabel)}
              locale={locale}
            />
          ) : state.status === "idle" ? (
            <p className="mt-1 text-xs text-emerald-100/65">
              {pick(
                locale,
                "Run each stage here. AI stages can take several minutes.",
                "在这里运行各阶段，AI 任务可能需要几分钟。",
              )}
            </p>
          ) : (
            <p
              className={`mt-1 text-xs ${
                state.status === "success"
                  ? "text-[#d9ff62]"
                  : "text-rose-200"
              }`}
              role="status"
              aria-live="polite"
            >
              {state.message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {PIPELINES.map((pipeline) => (
            <button
              key={pipeline.name}
              type="submit"
              name="pipeline"
              value={pipeline.name}
              disabled={pending}
              className="rounded-lg border border-emerald-100/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-50"
            >
              {pending && activePipeline === pipeline.name
                ? pick(locale, "Running...", "运行中...")
                : pick(locale, ...pipeline.label)}
            </button>
          ))}
        </div>
      </div>

      {!pending && state.output && (
        <details className="mt-3 rounded-lg bg-black/15 px-3 py-2">
          <summary className="cursor-pointer text-xs text-emerald-100/75">
            {pick(locale, "View latest run output", "查看最近运行输出")}
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-5 text-emerald-50/80">
            {state.output}
          </pre>
        </details>
      )}
    </>
  );
}

export function PipelineControls({ locale }: { locale: Locale }) {
  const [state, action] = useActionState(runPipeline, INITIAL_PIPELINE_STATE);
  const [activePipeline, setActivePipeline] = useState<PipelineName | null>(
    null,
  );

  return (
    <section className="border-b border-white/10 bg-[#18352e] text-emerald-50">
      <div className="mx-auto max-w-[1500px] px-5 py-3 lg:px-8">
        <form
          action={action}
          onSubmit={(event) => {
            const submitter = (
              event.nativeEvent as SubmitEvent
            ).submitter as HTMLButtonElement | null;
            const pipeline = submitter?.value as PipelineName | undefined;
            setActivePipeline(pipeline ?? null);
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <PipelineFormContent
            activePipeline={activePipeline}
            state={state}
            locale={locale}
          />
        </form>
      </div>
    </section>
  );
}
