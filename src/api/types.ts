/**
 * Wire contract for the ai-med-agent POC backend.
 * Mirrors src/ai_med_agent/adapters/inbound/http/http__type.py and the
 * streaming envelope in domain/streaming/streaming__type.py.
 */

export type TranscriptStatus = "draft" | "approved";

export interface TranscriptDto {
  id: string;
  text: string;
  status: TranscriptStatus;
  language: string | null;
  created_at: string;
}

export type RunStatus = "running" | "completed" | "failed" | "interrupted";

export type BlockKind = "differential" | "gap_analysis" | "treatment";

/** Persisted agent output block. `payload` is LLM-produced JSON — parse defensively. */
export interface BlockDto {
  id: string;
  kind: BlockKind | string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface RunDto {
  id: string;
  transcript_id: string;
  status: RunStatus;
  created_at: string;
  blocks: BlockDto[];
}

export type StreamEventType =
  | "run_started"
  | "tool_call"
  | "tool_result"
  | "content_block_delta"
  | "block_ready"
  | "run_completed"
  | "run_failed"
  | "ping";

/**
 * Versioned ai.event envelope. Sent as SSE `event: ai.event`; the discriminator
 * is the JSON `type` field. `seq` restarts on replay — dedupe blocks by block_id.
 */
export interface AiEvent {
  v: number;
  run_id: string;
  seq: number;
  ts: string;
  type: StreamEventType | string;
  replay?: boolean;
  // block_ready
  kind?: string;
  block_id?: string;
  // tool_call / tool_result
  tool_name?: string;
  tool_kwargs_preview?: string;
  output_preview?: string;
  // content_block_delta
  stream?: string;
  delta?: string;
  // run_failed
  error?: string;
}

export type TraceMessageType = "tool_call" | "tool_result" | "agent_output";

export interface TraceMessageDto {
  id: string;
  seq: number;
  type: TraceMessageType;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Block payload shapes are contracts-by-prompt (no server-side validation). */
export interface DifferentialItem {
  name: string;
  icd10: string;
  diagnostic_confidence: number;
  diagnostic_rationale: string;
  evidence_confidence: number;
  evidence_rationale: string;
  sources: string[];
}

export interface DifferentialPayload {
  differentials: DifferentialItem[];
}

export interface GapAnalysisPayload {
  red_flags: string[];
  missing_questions: string[];
  recommended_tests: string[];
  sources: string[];
}

export interface TreatmentPayload {
  plan_type: "preliminary" | "final";
  steps: string[];
  rationale: string;
  sources: string[];
}
