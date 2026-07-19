import React from "react";

export function ConfidenceMeter({ level = "high", showLabel = true }) {
  const n = { high: 3, medium: 2, low: 1 }[level] || 3;
  const color = `var(--conf-${level})`;
  const label = { high: "High confidence", medium: "Medium confidence", low: "Low confidence — verify" }[level];
  return (
    <span title={label} style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "3px 10px",
      background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
      borderRadius: "var(--r-full)", fontFamily: "var(--font-ui)",
    }}>
      <span style={{ display: "inline-flex", gap: 3 }} aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} style={{ width: 5, height: 11, borderRadius: 2, background: i <= n ? color : "var(--n-200)" }} />
        ))}
      </span>
      {showLabel && <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{label}</span>}
    </span>
  );
}
