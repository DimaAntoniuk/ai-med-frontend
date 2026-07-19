import React from "react";

export function VitalCard({ label, value, unit, trend, status = "normal", source, time }) {
  const statusFg = { normal: "var(--text-primary)", warning: "var(--warning)", critical: "var(--critical)" }[status] || "var(--text-primary)";
  const trendGlyph = trend === "up" ? "↑" : trend === "down" ? "↓" : trend === "flat" ? "→" : null;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4, padding: "12px 14px", minWidth: 130,
      background: "var(--surface-card)", borderRadius: "var(--r-lg)",
      border: `1px solid ${status === "critical" ? "var(--critical-border)" : "var(--border-subtle)"}`,
      boxShadow: "var(--shadow-xs)", fontFamily: "var(--font-ui)",
    }}>
      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: "var(--weight-bold)", fontFamily: "var(--font-mono)", color: statusFg }}>{value}</span>
        {unit && <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{unit}</span>}
        {trendGlyph && <span style={{ fontSize: "var(--text-sm)", color: statusFg }}>{trendGlyph}</span>}
      </span>
      {(source || time) && (
        <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
          {[source, time].filter(Boolean).join(" · ")}
        </span>
      )}
    </div>
  );
}
