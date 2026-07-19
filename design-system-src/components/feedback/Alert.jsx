import React from "react";

const tones = {
  info:     { bd: "var(--info-border)", bg: "var(--info-tint)", fg: "var(--info)" },
  success:  { bd: "var(--success-border)", bg: "var(--success-tint)", fg: "var(--success)" },
  warning:  { bd: "var(--warning-border)", bg: "var(--warning-tint)", fg: "var(--warning)" },
  critical: { bd: "var(--critical-border)", bg: "var(--critical-tint)", fg: "var(--critical)" },
  ai:       { bd: "var(--ai-border)", bg: "var(--ai-tint)", fg: "var(--ai-text)" },
};

export function Alert({ tone = "info", title, action, onDismiss, children }) {
  const t = tones[tone] || tones.info;
  return (
    <div role="alert" style={{
      display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px",
      background: t.bg, border: `1px solid ${t.bd}`, borderRadius: "var(--r-lg)",
      fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.fg, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {title && <span style={{ fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", fontSize: "var(--text-base)" }}>{title}</span>}
        <span style={{ color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" }}>{children}</span>
        {action && <div style={{ marginTop: 6 }}>{action}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" style={{ appearance: "none", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 15, lineHeight: 1, padding: 2 }}>×</button>
      )}
    </div>
  );
}
