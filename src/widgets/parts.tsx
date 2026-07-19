import type { ReactNode } from "react";
import { Card } from "../design/data/Card";
import { AIBadge } from "../design/ai/AIBadge";
import { SourceRow } from "../design/ai/CitationChip";
import { ConfidenceMeter } from "../design/ai/ConfidenceMeter";
import { useT } from "../i18n";

/** Defensive readers — block payloads are LLM-produced, never trust the shape. */
export const asStr = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

export const asNum = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export const asStrArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export const asObjArray = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    : [];

export function confidenceLevel(score: number | null): "high" | "medium" | "low" {
  if (score === null) return "low";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function Overline({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "var(--tracking-caps)",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </span>
  );
}

/** One labelled confidence row: meter + numeric score (mono) + rationale. */
export function ConfidenceRow({
  label,
  score,
  rationale,
}: {
  label: string;
  score: number | null;
  rationale: string;
}) {
  const t = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ minWidth: 76, display: "inline-flex" }}>
          <Overline>{label}</Overline>
        </span>
        <ConfidenceMeter
          level={confidenceLevel(score)}
          labels={{
            high: t("confidence.high"),
            medium: t("confidence.medium"),
            low: t("confidence.low"),
          }}
        />
        {score !== null && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
            }}
          >
            {score}/100
          </span>
        )}
      </div>
      {rationale && (
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{rationale}</div>
      )}
    </div>
  );
}

export function SourceList({ sources }: { sources: string[] }) {
  const t = useT();
  if (sources.length === 0) return null;
  return (
    <div>
      <Overline>{t("widget.sources")}</Overline>
      <div>
        {sources.map((source, i) => (
          <SourceRow key={source} index={i + 1} source={source} />
        ))}
      </div>
    </div>
  );
}

/** Shared chrome for AI-generated blocks: violet-bordered card + AI badge. */
export function AIBlockCard({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <Card title={title} ai action={<AIBadge label={t("widget.aiGenerated")} />} footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </Card>
  );
}
