import React from "react";

export function AcuityPill({ level = "low", label }) {
  const l = ["low", "moderate", "high", "critical"].includes(level) ? level : "low";
  const text = label || { low: "Low", moderate: "Moderate", high: "High", critical: "Critical" }[l];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 10px",
      background: `var(--acuity-${l}-tint)`, color: `var(--acuity-${l})`,
      border: `1px solid color-mix(in oklch, var(--acuity-${l}) 30%, white)`,
      borderRadius: "var(--r-full)", fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-semibold)", fontFamily: "var(--font-ui)", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: `var(--acuity-${l})` }} />
      {text}
    </span>
  );
}
