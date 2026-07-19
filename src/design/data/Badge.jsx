import React from "react";

const tones = {
  neutral:  { bg: "var(--n-100)", fg: "var(--text-secondary)", bd: "var(--border-subtle)" },
  primary:  { bg: "var(--primary-tint)", fg: "var(--primary)", bd: "var(--primary-border)" },
  success:  { bg: "var(--success-tint)", fg: "var(--success)", bd: "var(--success-border)" },
  warning:  { bg: "var(--warning-tint)", fg: "var(--warning)", bd: "var(--warning-border)" },
  critical: { bg: "var(--critical-tint)", fg: "var(--critical)", bd: "var(--critical-border)" },
  info:     { bg: "var(--info-tint)", fg: "var(--info)", bd: "var(--info-border)" },
  ai:       { bg: "var(--ai-tint)", fg: "var(--ai-text)", bd: "var(--ai-border)" },
};

export function Badge({ tone = "neutral", dot, children, style }) {
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 10px",
      background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      borderRadius: "var(--r-full)", fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-semibold)", fontFamily: "var(--font-ui)",
      whiteSpace: "nowrap", ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.fg }} />}
      {children}
    </span>
  );
}

export function Tag({ children, onRemove, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px",
      background: "var(--surface-card)", border: "1px solid var(--border-strong)",
      borderRadius: "var(--r-sm)", fontSize: "var(--text-sm)", color: "var(--text-primary)",
      fontFamily: "var(--font-ui)", whiteSpace: "nowrap", ...style,
    }}>
      {children}
      {onRemove && (
        <button onClick={onRemove} aria-label="Remove" style={{ appearance: "none", background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--text-tertiary)", fontSize: 13, lineHeight: 1 }}>×</button>
      )}
    </span>
  );
}
