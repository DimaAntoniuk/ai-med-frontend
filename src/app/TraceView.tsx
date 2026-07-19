import { useState } from "react";
import { api } from "../api/client";
import type { TraceMessageDto } from "../api/types";
import { Card } from "../design/data/Card";
import { Button } from "../design/forms/Button";
import { AuditLogEntry } from "../design/ai/AuditLogEntry";

function clip(value: unknown, max = 160): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function entryProps(message: TraceMessageDto) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const base = { time, id: `seq ${message.seq}` };
  switch (message.type) {
    case "tool_call":
      return {
        ...base,
        kind: "ai" as const,
        actor: "MedAI",
        action: `called ${String(message.payload.tool_name ?? "a tool")}`,
        target: clip(message.payload.tool_kwargs),
      };
    case "tool_result":
      return {
        ...base,
        kind: "system" as const,
        actor: String(message.payload.tool_name ?? "tool"),
        action: "returned",
        target: clip(message.payload.output),
      };
    case "agent_output":
      return {
        ...base,
        kind: "ai" as const,
        actor: "MedAI",
        action: "completed the run",
        target: clip(message.payload.text, 300),
      };
  }
}

/** Durable run history from GET /runs/{id}/trace — the trail admins observe. */
export function TraceView({ runId }: { runId: string }) {
  const [messages, setMessages] = useState<TraceMessageDto[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      setMessages(await api.getTrace(runId));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Audit trail"
      action={
        <Button size="sm" variant="secondary" onClick={toggle}>
          {open ? "Hide audit trail" : "View audit trail"}
        </Button>
      }
    >
      {!open && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          Every tool call and result in this run is logged for oversight.
        </span>
      )}
      {open && loading && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          Loading the trail…
        </span>
      )}
      {open && !loading && messages && messages.length === 0 && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          No trace entries recorded for this run.
        </span>
      )}
      {open && !loading && messages && messages.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {messages.map((message, i) => (
            <AuditLogEntry key={message.id} {...entryProps(message)} last={i === messages.length - 1} />
          ))}
        </div>
      )}
    </Card>
  );
}
