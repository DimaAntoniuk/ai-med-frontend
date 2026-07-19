import React from "react";

export function Card({ title, action, footer, padding = 16, ai, children, style }) {
  return (
    <div style={{
      background: "var(--surface-card)", borderRadius: "var(--r-lg)",
      border: `1px solid ${ai ? "var(--ai-border)" : "var(--border-subtle)"}`,
      boxShadow: ai ? "var(--shadow-ai)" : "var(--shadow-sm)",
      display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
      fontFamily: "var(--font-ui)", ...style,
    }}>
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `12px ${padding}px`, borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{title}</span>
          {action}
        </div>
      )}
      <div style={{ padding, flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: `10px ${padding}px`, borderTop: "1px solid var(--border-subtle)", background: "var(--n-25)" }}>{footer}</div>}
    </div>
  );
}
