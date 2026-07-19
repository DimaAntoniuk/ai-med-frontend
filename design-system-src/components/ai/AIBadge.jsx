import React from "react";

export function AIBadge({ label = "AI-generated", compact }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: compact ? "1px 7px" : "2px 10px",
      background: "var(--ai-tint)", color: "var(--ai-text)", border: "1px solid var(--ai-border)",
      borderRadius: "var(--r-full)", fontSize: compact ? "var(--text-xs)" : "var(--text-sm)",
      fontWeight: "var(--weight-semibold)", fontFamily: "var(--font-ui)", whiteSpace: "nowrap",
    }}>
      <svg width={compact ? 10 : 12} height={compact ? 10 : 12} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <path d="M6 0l1.4 4.6L12 6l-4.6 1.4L6 12 4.6 7.4 0 6l4.6-1.4z" />
      </svg>
      {label}
    </span>
  );
}
