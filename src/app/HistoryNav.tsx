import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { TranscriptSummaryDto } from "../api/types";
import { useSettings } from "../i18n";
import { SESSION_EVENT, currentTranscriptId } from "./ConsultationScreen";

const PAGE_SIZE = 50;

/**
 * Sidebar consultation history (ChatGPT-style): a vertically scrolling list of
 * newest-first previews from GET /transcripts. Refreshes itself on session
 * changes, so a freshly created draft appears (and highlights) immediately.
 */
export function HistoryNav({ onOpen }: { onOpen: (transcriptId: string) => void }) {
  const { t, locale } = useSettings();
  const [items, setItems] = useState<TranscriptSummaryDto[] | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(() => currentTranscriptId());

  const refresh = useCallback(async () => {
    try {
      const page = await api.listTranscripts(PAGE_SIZE, 0);
      setItems(page);
      setExhausted(page.length < PAGE_SIZE);
    } catch {
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onSession = () => {
      setActiveId(currentTranscriptId());
      refresh();
    };
    window.addEventListener(SESSION_EVENT, onSession);
    return () => window.removeEventListener(SESSION_EVENT, onSession);
  }, [refresh]);

  const loadMore = async () => {
    if (!items) return;
    try {
      const page = await api.listTranscripts(PAGE_SIZE, items.length);
      setItems([...items, ...page]);
      if (page.length < PAGE_SIZE) setExhausted(true);
    } catch {
      /* keep what we have */
    }
  };

  const tooltipOf = (item: TranscriptSummaryDto) => {
    const when = new Date(item.created_at).toLocaleString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const status = item.status === "approved" ? t("history.approved") : t("history.draft");
    return `${when} — ${status}`;
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {items === null ? (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", padding: "4px 12px" }}>
          {t("history.loading")}
        </span>
      ) : items.length === 0 ? (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", padding: "4px 12px" }}>
          {t("history.empty")}
        </span>
      ) : (
        <>
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => onOpen(item.id)}
                title={tooltipOf(item)}
                style={{
                  appearance: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                  padding: "7px 12px",
                  borderRadius: "var(--r-md)",
                  background: active ? "var(--primary-tint)" : "transparent",
                  fontFamily: "var(--font-ui)",
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--surface-sunken)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: item.status === "approved" ? "var(--success)" : "var(--warning)",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: "var(--text-sm)",
                    color: active ? "var(--primary)" : "var(--text-secondary)",
                    fontWeight: active ? "var(--weight-semibold)" : "var(--weight-regular)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.preview}
                </span>
              </button>
            );
          })}
          {!exhausted && (
            <button
              onClick={loadMore}
              style={{
                appearance: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                flexShrink: 0,
                padding: "6px 12px",
                background: "transparent",
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-xs)",
                color: "var(--text-tertiary)",
              }}
            >
              {t("history.more")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
