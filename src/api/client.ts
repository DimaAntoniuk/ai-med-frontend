import type {
  ConversationDto,
  RunDto,
  TraceMessageDto,
  TranscriptDto,
  TranscriptSummaryDto,
  UtteranceDto,
} from "./types";

/**
 * The POC backend allows the dev-server origin via its CORS_ORIGINS setting.
 *
 * `import.meta.env` is optional-chained because the SSR smoke scripts load this
 * module under tsx, where Vite's env shim does not exist.
 */
const BASE = import.meta.env?.VITE_API_BASE ?? "http://localhost:8000";

/** Absolute URL for a backend path — for the `/start` routes the browser navigates to. */
export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    /**
     * Interpolations for `detail` when it is an i18n message key rather than a
     * sentence — the team/billing surface answers `{detail, params}`.
     */
    public readonly params?: Record<string, string | number>,
  ) {
    super(detail);
    this.name = "ApiRequestError";
  }
}

/** What `GET /auth/methods` answers — the sign-in page's whole shape. */
export interface AuthMethods {
  /** Email one-time code. Always available. */
  otp: boolean;
  /** WorkOS AuthKit is configured on the backend. */
  sso: boolean;
  /** false means AUTH_ENABLED=false — the gate is disarmed, skip the wall. */
  required: boolean;
  /**
   * The deployment is corporate-login-only. Say so before the doctor types: an
   * outside address gets the same 202 with no code ever arriving. It reveals
   * only *that* a restriction exists, never the domain list.
   */
  restricted: boolean;
}

/** Fired when a clinical route answers 401 — the app swaps to the sign-in screen. */
export const UNAUTHORIZED_EVENT = "medai:unauthorized";

/**
 * Fired when a clinical route answers 402 — the doctor is signed in correctly
 * but the workspace has no subscription to work against, or their own seat is
 * suspended. 402 is not 401: the session stays, only the surface is locked.
 * `detail` carries the message key the backend sent.
 */
export const PAYMENT_REQUIRED_EVENT = "medai:payment-required";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
    // The billing routes are the answer to a 402, so they never raise one.
    if (response.status === 402 && !path.startsWith("/billing")) {
      window.dispatchEvent(new CustomEvent(PAYMENT_REQUIRED_EVENT, { detail }));
    }
    const params =
      body && body.params && typeof body.params === "object" ? body.params : undefined;
    throw new ApiRequestError(response.status, detail, params);
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

  /**
   * What the sign-in page may offer. `sso` is false wherever the deployment has
   * no WorkOS credentials, and `/auth/sso/start` 404s there — so the button is
   * rendered from this answer, never from a guess.
   */
  authMethods(): Promise<AuthMethods> {
    return request<AuthMethods>("/auth/methods");
  },

  /**
   * Our session dies server-side either way. `sign_out_url` is non-empty only
   * while an identity provider still holds a session of its own, and the
   * browser has to go there: skip it and the next person at a shared clinic
   * workstation is silently let back in as the doctor who just left.
   */
  logout(): Promise<{ status: string; sign_out_url: string }> {
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
