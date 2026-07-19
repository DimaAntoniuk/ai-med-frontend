import { useEffect, useRef, useState } from "react";
import { ApiRequestError, api } from "../api/client";
import type { RunStatus, TranscriptDto } from "../api/types";
import { Badge, Tag } from "../design/data/Badge";
import { Card } from "../design/data/Card";
import { Alert } from "../design/feedback/Alert";
import { Button } from "../design/forms/Button";
import { Textarea } from "../design/forms/Textarea";
import { AIBadge } from "../design/ai/AIBadge";
import { WidgetView } from "../widgets";
import { useRun } from "./useRun";
import { TraceView } from "./TraceView";

const SESSION_KEY = "medai-poc-session";

interface Session {
  transcriptId?: string;
  runId?: string;
}

function loadSession(): Session {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveSession(session: Session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function runBadge(status: RunStatus | null) {
  switch (status) {
    case "running":
      return <Badge tone="info" dot>Running</Badge>;
    case "completed":
      return <Badge tone="success" dot>Completed</Badge>;
    case "failed":
      return <Badge tone="critical" dot>Failed</Badge>;
    case "interrupted":
      return <Badge tone="critical" dot>Interrupted</Badge>;
    default:
      return null;
  }
}

export function ConsultationScreen() {
  const [transcript, setTranscript] = useState<TranscriptDto | null>(null);
  const [text, setText] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thoughtsOpen, setThoughtsOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const run = useRun(runId);

  // Rehydrate a session after reload — Postgres is the backend's source of
  // truth, so GET /transcripts/{id} + the SSE replay restore the whole view.
  useEffect(() => {
    const session = loadSession();
    if (!session.transcriptId) return;
    api
      .getTranscript(session.transcriptId)
      .then((dto) => {
        setTranscript(dto);
        setText(dto.text);
        if (session.runId) setRunId(session.runId);
      })
      .catch(() => saveSession({}));
  }, []);

  const guard = async (label: string, action: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.detail : "Something went wrong — try again.");
    } finally {
      setBusy(null);
    }
  };

  const createDraft = () =>
    guard("create", async () => {
      const dto = await api.createTranscript(text.trim());
      setTranscript(dto);
      setText(dto.text);
      saveSession({ transcriptId: dto.id });
    });

  const uploadAudio = (file: File) =>
    guard("upload", async () => {
      const dto = await api.createTranscriptFromAudio(file);
      setTranscript(dto);
      setText(dto.text);
      saveSession({ transcriptId: dto.id });
    });

  const saveEdits = () =>
    guard("save", async () => {
      if (!transcript) return;
      const dto = await api.updateTranscript(transcript.id, text.trim());
      setTranscript(dto);
      setText(dto.text);
    });

  const approve = () =>
    guard("approve", async () => {
      if (!transcript) return;
      const dirty = text.trim() !== transcript.text;
      const saved = dirty ? await api.updateTranscript(transcript.id, text.trim()) : transcript;
      const dto = await api.approveTranscript(saved.id);
      setTranscript(dto);
      setText(dto.text);
    });

  const startRun = () =>
    guard("run", async () => {
      if (!transcript) return;
      const dto = await api.createRun(transcript.id);
      setRunId(dto.id);
      saveSession({ transcriptId: transcript.id, runId: dto.id });
    });

  const reset = () => {
    setTranscript(null);
    setText("");
    setRunId(null);
    setError(null);
    setThoughtsOpen(false);
    saveSession({});
  };

  const isDraft = transcript?.status === "draft";
  const isApproved = transcript?.status === "approved";
  const dirty = isDraft && transcript !== null && text.trim() !== transcript.text;
  const runFinished = run.status === "completed" || run.status === "failed" || run.status === "interrupted";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {error && (
        <Alert tone="critical" title="Request failed" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 1 — consultation transcript intake */}
      {!transcript && (
        <Card title="New consultation">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Textarea
              label="Consultation transcript"
              hint="Paste the consultation text, or upload an audio recording. Audio is transcribed locally and never stored."
              rows={9}
              placeholder="Patient reports…"
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Button onClick={createDraft} disabled={!text.trim() || busy !== null}>
                {busy === "create" ? "Creating draft…" : "Create draft"}
              </Button>
              <Button
                variant="secondary"
                disabled={busy !== null}
                onClick={() => fileInput.current?.click()}
              >
                {busy === "upload" ? "Transcribing audio…" : "Upload audio"}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAudio(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Step 2 — doctor review gate */}
      {transcript && (
        <Card
          title="Consultation transcript"
          action={
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {transcript.language && <Tag style={{ fontFamily: "var(--font-mono)" }}>{transcript.language}</Tag>}
              {isDraft ? (
                <Badge tone="warning" dot>Draft — awaiting review</Badge>
              ) : (
                <Badge tone="success" dot>Approved</Badge>
              )}
            </span>
          }
          footer={
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              transcript {transcript.id}
            </span>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isDraft ? (
              <Textarea
                hint="Review and correct the transcript. Nothing reaches MedAI until you approve it."
                rows={7}
                value={text}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
              />
            ) : (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "var(--text-base)",
                  lineHeight: "var(--leading-normal)",
                  padding: "10px 12px",
                  background: "var(--surface-sunken)",
                  borderRadius: "var(--r-md)",
                }}
              >
                {transcript.text}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isDraft && (
                <>
                  <Button onClick={approve} disabled={busy !== null || !text.trim()}>
                    {busy === "approve" ? "Approving…" : "Approve transcript"}
                  </Button>
                  {dirty && (
                    <Button variant="secondary" onClick={saveEdits} disabled={busy !== null}>
                      {busy === "save" ? "Saving…" : "Save changes"}
                    </Button>
                  )}
                </>
              )}
              {isApproved && !runId && (
                <Button variant="ai" onClick={startRun} disabled={busy !== null}>
                  {busy === "run" ? "Starting run…" : "Run MedAI analysis"}
                </Button>
              )}
              {isApproved && !runId && (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
                  Identifying details are redacted locally before MedAI sees the text.
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Step 3 — agent run: streamed lego-block widgets */}
      {runId && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" }}>
            <AIBadge compact label="MedAI" />
            {runBadge(run.status)}
            {run.status === "running" && (
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
                {run.activity ?? "Working"}…
              </span>
            )}
            <span style={{ flex: 1 }} />
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              run {runId.slice(0, 8)}
            </span>
          </div>

          {run.thoughts && run.status === "running" && (
            <div
              style={{
                border: "1px solid var(--ai-border)",
                background: "var(--ai-tint)",
                borderRadius: "var(--r-md)",
                padding: "8px 12px",
                fontSize: "var(--text-sm)",
                color: "var(--ai-text)",
                cursor: "pointer",
              }}
              onClick={() => setThoughtsOpen((v) => !v)}
              title="MedAI working notes — click to expand"
            >
              <span style={{ fontWeight: "var(--weight-semibold)" }}>Working notes </span>
              <span
                style={{
                  display: "block",
                  whiteSpace: "pre-wrap",
                  maxHeight: thoughtsOpen ? "none" : 42,
                  overflow: "hidden",
                  color: "var(--text-secondary)",
                }}
              >
                {thoughtsOpen ? run.thoughts : run.thoughts.slice(-260)}
              </span>
            </div>
          )}

          {run.widgets.map((descriptor) => (
            <WidgetView key={descriptor.id} descriptor={descriptor} />
          ))}

          {run.status === "failed" && (
            <Alert tone="critical" title="Run failed">
              {run.error ?? "The agent run failed."} The transcript is unchanged — start a new run to retry.
            </Alert>
          )}
          {run.status === "interrupted" && (
            <Alert tone="warning" title="Run interrupted">
              The service restarted while this run was in progress. Completed blocks above were preserved.
            </Alert>
          )}
          {run.status === "completed" && run.widgets.length === 0 && (
            <Alert tone="info" title="No blocks produced">
              The run completed without presenting any result blocks.
            </Alert>
          )}

          {runFinished && <TraceView runId={runId} />}
          {runFinished && (
            <div>
              <Button variant="secondary" onClick={reset}>Start new consultation</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
