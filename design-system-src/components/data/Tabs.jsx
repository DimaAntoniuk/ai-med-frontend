import React from "react";

export function Tabs({ tabs = [], value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-ui)" }}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button key={t.value} onClick={() => onChange && onChange(t.value)} style={{
            appearance: "none", background: "transparent", border: "none", cursor: "pointer",
            padding: "10px 14px", marginBottom: -1,
            fontSize: "var(--text-base)", fontFamily: "var(--font-ui)",
            fontWeight: active ? "var(--weight-semibold)" : "var(--weight-regular)",
            color: active ? "var(--primary)" : "var(--text-secondary)",
            borderBottom: `2px solid ${active ? "var(--primary)" : "transparent"}`,
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            {t.count != null && (
              <span style={{
                fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", padding: "1px 7px",
                borderRadius: "var(--r-full)",
                background: active ? "var(--primary-tint)" : "var(--n-100)",
                color: active ? "var(--primary)" : "var(--text-tertiary)",
              }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
