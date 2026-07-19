import { useEffect, useState } from "react";
import { ApiRequestError, api } from "../api/client";
import type { TranscriptSummaryDto } from "../api/types";
import { Badge, Tag } from "../design/data/Badge";
import { Card } from "../design/data/Card";
import { Alert } from "../design/feedback/Alert";
import { Button } from "../design/forms/Button";
import { useSettings } from "../i18n";

const PAGE_SIZE = 50;

/**
 * Consultation history: newest-first summaries from GET /transcripts.
 * Rows are previews only — clicking one opens the full transcript (and its
 * conversation view) in the Consultation screen. No violet here — history
 * entries are doctor-authored records, not AI output.
 */
export function HistoryScreen({ onOpen }: { onOpen: (transcriptId: string) => void }) {
  const { t, locale } = useSettings();
  const [items, setItems] = useState<TranscriptSummaryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchPage = async (offset: number) => {
    setBusy(true);
    setError(null);
    try {
      const page = await api.listTranscripts(PAGE_SIZE, offset);
      setItems((prev) => [...(prev ?? []), ...page]);
      if (page.length < PAGE_SIZE) setExhausted(true);
    } catch (e) {
      setError(e instanceof ApiRequestError && e.status !== 0 ? e.detail : t("error.unreachable"));
      if (offset === 0) setItems([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateOf = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {error && (
        <Alert tone="critical" title={t("error.title")} onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card title={t("history.title")}>
        {items === null ? (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {t("history.loading")}
          </span>
        ) : items.length === 0 && !error ? (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {t("history.empty")}
          </span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpen(item.id)}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                  padding: "11px 13px",
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--r-lg)",
                  fontFamily: "var(--font-ui)",
                  transition: "border-color 120ms ease, background 120ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-border)";
                  e.currentTarget.style.background = "var(--primary-tint)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.background = "var(--surface-card)";
                }}
              >
                <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: "var(--text-base)",
                      lineHeight: "var(--leading-normal)",
                      color: "var(--text-primary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.preview}
                  </span>
                  {item.status === "approved" ? (
                    <Badge tone="success" dot>{t("history.approved")}</Badge>
                  ) : (
                    <Badge tone="warning" dot>{t("history.draft")}</Badge>
                  )}
                </span>
                <span
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                    fontSize: "var(--text-xs)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)" }}>{dateOf(item.created_at)}</span>
                  {item.doctor_count > 0 && <span>{t("history.doctors", { n: item.doctor_count })}</span>}
                  {item.patient_count > 0 && <span>{t("history.patients", { n: item.patient_count })}</span>}
                  {item.language && (
                    <Tag style={{ fontFamily: "var(--font-mono)" }}>{item.language}</Tag>
                  )}
                </span>
              </button>
            ))}

            {!exhausted && items.length > 0 && (
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => fetchPage(items.length)}
                >
                  {busy ? t("history.loading") : t("history.more")}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
