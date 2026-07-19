import { useMemo, useState } from "react";
import type { SpeakerRole, UtteranceDto } from "../api/types";
import { Alert } from "../design/feedback/Alert";
import { Button } from "../design/forms/Button";
import { Select } from "../design/forms/Select";
import { useT, type Translate } from "../i18n";

/**
 * Manual speaker attribution for markerless (e.g. audio) transcripts: the raw
 * text is pre-split into sentences, the doctor assigns each line a speaker,
 * merges or removes lines, and saves. Saving PUTs the full structure — the
 * backend then regenerates the canonical marker text from it.
 */

interface Row {
  key: number;
  speaker: string; // "doctor-1", "patient-2", …
  text: string;
}

const SPEAKER_VALUES = ["doctor-1", "doctor-2", "doctor-3", "patient-1", "patient-2"];

function speakerLabel(t: Translate, value: string): string {
  const [role, n] = value.split("-");
  const base = role === "patient" ? t("conversation.patient") : t("conversation.doctor");
  return n === "1" ? base : `${base} ${n}`;
}

function splitSentences(raw: string): string[] {
  return raw
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

function initialRows(raw: string, existing: UtteranceDto[]): Row[] {
  if (existing.length > 0) {
    return existing.map((u, i) => ({ key: i, speaker: `${u.role}-${u.speaker}`, text: u.text }));
  }
  // Consultations usually alternate, so prefill doctor/patient in turn — a
  // starting guess the doctor corrects, not an inference.
  return splitSentences(raw).map((text, i) => ({
    key: i,
    speaker: i % 2 === 0 ? "doctor-1" : "patient-1",
    text,
  }));
}

export function AttributionEditor({
  rawText,
  existing,
  busy,
  onSave,
  onDiscard,
  onCancel,
}: {
  rawText: string;
  existing: UtteranceDto[];
  busy: boolean;
  onSave: (utterances: UtteranceDto[]) => void;
  /** Present only when a stored structure exists to discard. */
  onDiscard?: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [rows, setRows] = useState<Row[]>(() => initialRows(rawText, existing));
  const nextKey = useMemo(() => () => Math.max(0, ...rows.map((r) => r.key)) + 1, [rows]);

  const patch = (key: number, change: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...change } : r)));

  const mergeUp = (index: number) =>
    setRows((rs) => {
      const prev = rs[index - 1];
      const cur = rs[index];
      return rs
        .map((r) => (r === prev ? { ...prev, text: `${prev.text} ${cur.text}`.trim() } : r))
        .filter((r) => r !== cur);
    });

  const addRow = () =>
    setRows((rs) => {
      const last = rs[rs.length - 1];
      const speaker = last?.speaker.startsWith("doctor") ? "patient-1" : "doctor-1";
      return [...rs, { key: nextKey(), speaker, text: "" }];
    });

  const utterances = (): UtteranceDto[] =>
    rows
      .filter((r) => r.text.trim())
      .map((r) => {
        const [role, n] = r.speaker.split("-");
        return { role: role as SpeakerRole, speaker: Number(n), text: r.text.trim() };
      });

  const savable = rows.some((r) => r.text.trim());

  const iconButton: React.CSSProperties = {
    appearance: "none",
    border: "1px solid var(--border-default)",
    background: "var(--surface-card)",
    color: "var(--text-tertiary)",
    borderRadius: "var(--r-sm)",
    cursor: "pointer",
    width: 26,
    height: 26,
    flexShrink: 0,
    fontSize: "var(--text-sm)",
    lineHeight: 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
        {t("attribution.hint")}
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto", padding: 2 }}>
        {rows.map((row, i) => (
          <div key={row.key} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <Select
              options={SPEAKER_VALUES.map((v) => ({ value: v, label: speakerLabel(t, v) }))}
              value={row.speaker}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                patch(row.key, { speaker: e.target.value })
              }
              style={{ width: 130, flexShrink: 0 }}
            />
            <textarea
              value={row.text}
              rows={Math.min(4, Math.max(1, Math.ceil(row.text.length / 70)))}
              onChange={(e) => patch(row.key, { text: e.target.value })}
              style={{
                flex: 1,
                minWidth: 0,
                resize: "vertical",
                padding: "6px 9px",
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-base)",
                lineHeight: "var(--leading-normal)",
                color: "var(--text-primary)",
                background: "var(--surface-card)",
                border: `1px solid ${row.speaker.startsWith("doctor") ? "var(--primary-border)" : "var(--border-strong)"}`,
                borderRadius: "var(--r-md)",
              }}
            />
            <button
              title={t("attribution.merge")}
              onClick={() => mergeUp(i)}
              disabled={i === 0}
              style={{ ...iconButton, opacity: i === 0 ? 0.35 : 1 }}
            >
              ⤴
            </button>
            <button title={t("attribution.remove")} onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))} style={iconButton}>
              ×
            </button>
          </div>
        ))}
      </div>

      <div>
        <Button size="sm" variant="ghost" onClick={addRow}>
          + {t("attribution.add")}
        </Button>
      </div>

      <Alert tone="warning" title={t("attribution.warningTitle")}>
        {t("attribution.warning")}
      </Alert>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Button onClick={() => onSave(utterances())} disabled={busy || !savable}>
          {busy ? t("attribution.saving") : t("attribution.save")}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          {t("attribution.cancel")}
        </Button>
        <span style={{ flex: 1 }} />
        {onDiscard && (
          <Button variant="ghost" onClick={onDiscard} disabled={busy}>
            {t("attribution.discard")}
          </Button>
        )}
      </div>
    </div>
  );
}
