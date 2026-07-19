import type {
  ConversationDto,
  RunDto,
  TraceMessageDto,
  TranscriptDto,
  TranscriptSummaryDto,
  UtteranceDto,
} from "./types";

/** The POC backend allows the dev-server origin via its CORS_ORIGINS setting. */
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(detail);
    this.name = "ApiRequestError";
  }
}

/** Fired when a clinical route answers 401 — the app swaps to the sign-in screen. */
export const UNAUTHORIZED_EVENT = "medai:unauthorized";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    // The session is an HTTP-only cookie; every call must carry credentials.
    response = await fetch(`${BASE}${path}`, { credentials: "include", ...init });
  } catch {
    throw new ApiRequestError(0, "Cannot reach the MedAI service — is the backend running?");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const detail =
      body && typeof body.detail === "string"
        ? body.detail
        : `Request failed (${response.status})`;
    throw new ApiRequestError(response.status, detail);
  }
  return body as T;
}

function postJson<T>(path: string, payload?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

export const api = {
  /** Always 202 — whether the email is eligible is deliberately unobservable. */
  requestOtp(email: string): Promise<{ status: string }> {
    return postJson("/auth/otp/request", { email });
  },

  /** Sets the HTTP-only session cookie on success; 401 on a bad/expired code. */
  verifyOtp(email: string, code: string): Promise<{ status: string }> {
    return postJson("/auth/otp/verify", { email, code });
  },

  logout(): Promise<{ status: string }> {
    return postJson("/auth/logout");
  },

  /**
   * Session probe: a clinical GET for a nil run id answers 401 when the gate is
   * armed and no session is present, 404 when the caller is let through.
   */
  async probeAuth(): Promise<boolean> {
    try {
      await request("/runs/00000000-0000-0000-0000-000000000000");
      return true;
    } catch (e) {
      return !(e instanceof ApiRequestError && e.status === 401);
    }
  },

  createTranscript(text: string): Promise<TranscriptDto> {
    return postJson("/transcripts", { text });
  },

  createTranscriptFromAudio(file: File): Promise<TranscriptDto> {
    const form = new FormData();
    form.append("file", file);
    return request("/transcripts/audio", { method: "POST", body: form });
  },

  getTranscript(id: string): Promise<TranscriptDto> {
    return request(`/transcripts/${id}`);
  },

  /** Consultation history, newest first. */
  listTranscripts(limit = 50, offset = 0): Promise<TranscriptSummaryDto[]> {
    return request(`/transcripts?limit=${limit}&offset=${offset}`);
  },

  getConversation(id: string): Promise<ConversationDto> {
    return request(`/transcripts/${id}/conversation`);
  },

  getUtterances(id: string): Promise<UtteranceDto[]> {
    return request(`/transcripts/${id}/utterances`);
  },

  /**
   * Full replacement of the speaker structure. Side effect: the canonical raw
   * text is regenerated from these lines — unattributed text is dropped.
   */
  putUtterances(id: string, utterances: UtteranceDto[]): Promise<TranscriptDto> {
    return request(`/transcripts/${id}/utterances`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utterances }),
    });
  },

  /** Discard the structure; raw text stays untouched. */
  deleteUtterances(id: string): Promise<TranscriptDto> {
    return request(`/transcripts/${id}/utterances`, { method: "DELETE" });
  },

  /** Re-derive the structure from the current raw text's markers. */
  parseUtterances(id: string): Promise<TranscriptDto> {
    return postJson(`/transcripts/${id}/utterances/parse`);
  },

  updateTranscript(id: string, text: string): Promise<TranscriptDto> {
    return request(`/transcripts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  },

  approveTranscript(id: string): Promise<TranscriptDto> {
    return postJson(`/transcripts/${id}/approve`);
  },

  createRun(transcriptId: string): Promise<RunDto> {
    return postJson("/runs", { transcript_id: transcriptId });
  },

  /** Run history for a consultation, newest first. Summaries only — `blocks` is always empty here. */
  listRuns(transcriptId: string): Promise<RunDto[]> {
    return request(`/transcripts/${transcriptId}/runs`);
  },

  getRun(id: string): Promise<RunDto> {
    return request(`/runs/${id}`);
  },

  getTrace(runId: string): Promise<TraceMessageDto[]> {
    return request(`/runs/${runId}/trace`);
  },
};

export function streamUrl(runId: string): string {
  return `${BASE}/runs/${runId}/events`;
}
