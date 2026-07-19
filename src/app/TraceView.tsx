import { useState } from "react";
import { api } from "../api/client";
import type { TraceMessageDto } from "../api/types";
import { Card } from "../design/data/Card";
import { Button } from "../design/forms/Button";
import { AuditLogEntry } from "../design/ai/AuditLogEntry";
import { useSettings, type Translate } from "../i18n";

function clip(value: unknown, max = 160): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function entryProps(t: Translate, locale: string, message: TraceMessageDto) {
  const time = new Date(message.created_at).toLocaleTimeString(locale, {
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
        action: t("trace.called", { tool: String(message.payload.tool_name ?? "?") }),
        target: clip(message.payload.tool_kwargs),
      };
    case "tool_result":
      return {
        ...base,
        kind: "system" as const,
        actor: String(message.payload.tool_name ?? "tool"),
        action: t("trace.returned"),
        target: clip(message.payload.output),
      };
    case "agent_output":
      return {
        ...base,
        kind: "ai" as const,
        actor: "MedAI",
        action: t("trace.completed"),
        target: clip(message.payload.text, 300),
      };
  }
}

/** Durable run history from GET /runs/{id}/trace — the trail admins observe. */
export function TraceView({ runId }: { runId: string }) {
  const { t, locale } = useSettings();
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
      title={t("trace.title")}
      action={
        <Button size="sm" variant="secondary" onClick={toggle}>
          {open ? t("trace.hide") : t("trace.view")}
        </Button>
      }
    >
      {!open && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          {t("trace.notice")}
        </span>
      )}
      {open && loading && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          {t("trace.loading")}
        </span>
      )}
      {open && !loading && messages && messages.length === 0 && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          {t("trace.empty")}
        </span>
      )}
      {open && !loading && messages && messages.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {messages.map((message, i) => (
            <AuditLogEntry
              key={message.id}
              {...entryProps(t, locale, message)}
              last={i === messages.length - 1}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
