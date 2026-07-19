import { useState } from "react";
import { Badge } from "../design/data/Badge";
import { Button } from "../design/forms/Button";
import { AIBadge } from "../design/ai/AIBadge";
import { WidgetView, type WidgetDescriptor } from "../widgets";
import { useT, type Translate } from "../i18n";

/**
 * All run results under one collapsible panel, collapsed by default. The
 * collapsed preview is deliberately content-free — block titles only, no
 * diagnoses, counts or confidences — so the doctor can form their own
 * impression before reading the AI's. Expanding is an explicit choice.
 */

function blockTitle(t: Translate, type: string): string {
  switch (type) {
    case "differential":
      return t("widget.differential.title");
    case "gap_analysis":
      return t("widget.gap.title");
    case "treatment":
      return t("widget.treatment.title");
    default:
      return type;
  }
}

export function ResultsPanel({
  descriptors,
  running,
}: {
  descriptors: WidgetDescriptor[];
  running: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (descriptors.length === 0) return null;

  return (
    <div
      style={{
        border: "1px solid var(--ai-border)",
        borderRadius: "var(--r-lg)",
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: open ? "1px solid var(--border-subtle)" : "none",
        }}
      >
        <AIBadge compact label={t("results.title")} />
        <Badge tone="neutral">{descriptors.length}</Badge>
        <span style={{ flex: 1 }} />
        {open ? (
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            {t("results.hide")}
          </Button>
        ) : (
          <Button size="sm" variant="aiSubtle" onClick={() => setOpen(true)}>
            {t("results.show")}
          </Button>
        )}
      </div>

      {open ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16 }}>
          {descriptors.map((descriptor) => (
            <WidgetView key={descriptor.id} descriptor={descriptor} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px" }}>
          {descriptors.map((descriptor) => (
            <span
              key={descriptor.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "var(--text-base)",
                color: "var(--text-primary)",
              }}
            >
              <span style={{ color: "var(--success)", fontWeight: "var(--weight-semibold)" }}>✓</span>
              {blockTitle(t, descriptor.type)}
            </span>
          ))}
          {running && (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {t("results.streaming")}
            </span>
          )}
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {t("results.unbiasedNote")}
          </span>
        </div>
      )}
    </div>
  );
}
