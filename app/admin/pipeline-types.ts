export type PipelineName = "collection" | "enrichment" | "opportunities";

export interface PipelineActionState {
  status: "idle" | "success" | "error";
  pipeline: PipelineName | null;
  message: string;
  output: string;
  completedAt: string | null;
}

export const INITIAL_PIPELINE_STATE: PipelineActionState = {
  status: "idle",
  pipeline: null,
  message: "",
  output: "",
  completedAt: null,
};
