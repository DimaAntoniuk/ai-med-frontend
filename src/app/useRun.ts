import { useCallback, useEffect, useReducer, useRef } from "react";
import { api } from "../api/client";
import { streamUrl } from "../api/client";
import type { AiEvent, BlockDto, RunStatus } from "../api/types";
import type { WidgetDescriptor } from "../widgets/registry";

/** Friendly labels for the live activity line while the agent works. */
const TOOL_LABELS: Record<string, string> = {
  diagnostic_subagent: "Consulting the diagnostic subagent",
  gap_analysis_subagent: "Running gap analysis",
  treatment_subagent: "Drafting the treatment plan",
  retrieve: "Searching the clinical knowledge base",
  present: "Preparing a result block",
};

const THOUGHTS_LIMIT = 6000;

export interface RunViewState {
  status: RunStatus | null;
  widgets: WidgetDescriptor[];
  activity: string | null;
  thoughts: string;
  error: string | null;
  startedAt: string | null;
}

const initialState: RunViewState = {
  status: null,
  widgets: [],
  activity: null,
  thoughts: "",
  error: null,
  startedAt: null,
};

type Action =
  | { type: "reset" }
  | { type: "blocks"; blocks: BlockDto[]; status: RunStatus; createdAt: string }
  | { type: "event"; event: AiEvent };

function blockToWidget(block: BlockDto): WidgetDescriptor {
  return { type: block.kind, payload: block.payload, id: block.id };
}

function reduce(state: RunViewState, action: Action): RunViewState {
  switch (action.type) {
    case "reset":
      return initialState;
    case "blocks": {
      // GET /runs/{id} is the source of truth; blocks arrive ordered by created_at.
      return {
        ...state,
        status: action.status,
        startedAt: action.createdAt,
        widgets: action.blocks.map(blockToWidget),
        error: action.status === "interrupted" ? "Run interrupted by a service restart" : state.error,
      };
    }
    case "event": {
      const e = action.event;
      switch (e.type) {
        case "run_started":
          return { ...state, status: "running", activity: "MedAI is reading the transcript" };
        case "tool_call":
          return {
            ...state,
            activity: TOOL_LABELS[e.tool_name ?? ""] ?? `Calling ${e.tool_name ?? "a tool"}`,
          };
        case "tool_result":
          return state;
        case "content_block_delta": {
          const thoughts = (state.thoughts + (e.delta ?? "")).slice(-THOUGHTS_LIMIT);
          return { ...state, thoughts };
        }
        case "run_completed":
          return { ...state, status: "completed", activity: null };
        case "run_failed":
          return {
            ...state,
            status: "failed",
            activity: null,
            error: e.error ?? "The run failed",
          };
        default:
          return state;
      }
    }
  }
}

/**
 * Drives a run view: rehydrates from GET /runs/{id}, then follows the SSE
 * stream. block_ready events trigger a refetch (the envelope carries only
 * kind + block_id; payloads live in Postgres). The server closes the stream
 * after a terminal event — we must close the EventSource then, or the
 * browser would reconnect forever.
 */
export function useRun(runId: string | null): RunViewState {
  const [state, dispatch] = useReducer(reduce, initialState);
  const sourceRef = useRef<EventSource | null>(null);

  const refetch = useCallback((id: string) => {
    api
      .getRun(id)
      .then((run) =>
        dispatch({ type: "blocks", blocks: run.blocks, status: run.status, createdAt: run.created_at }),
      )
      .catch(() => {
        /* transient — the stream keeps driving the view */
      });
  }, []);

  useEffect(() => {
    dispatch({ type: "reset" });
    if (!runId) return;

    refetch(runId);
    // withCredentials: the SSE endpoint sits behind the same cookie-session gate
    const source = new EventSource(streamUrl(runId), { withCredentials: true });
    sourceRef.current = source;

    source.addEventListener("ai.event", (raw) => {
      let event: AiEvent;
      try {
        event = JSON.parse((raw as MessageEvent).data);
      } catch {
        return;
      }
      dispatch({ type: "event", event });
      if (event.type === "block_ready") refetch(runId);
      if (event.type === "run_completed" || event.type === "run_failed") {
        refetch(runId);
        source.close();
      }
    });

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [runId, refetch]);

  return state;
}
