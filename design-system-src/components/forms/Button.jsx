import React, { useState } from "react";

const variants = {
  primary:   { bg: "var(--primary)", bgH: "var(--primary-hover)", fg: "var(--text-inverse)", bd: "transparent" },
  secondary: { bg: "var(--surface-card)", bgH: "var(--n-50)", fg: "var(--text-primary)", bd: "var(--border-strong)" },
  ghost:     { bg: "transparent", bgH: "var(--n-100)", fg: "var(--text-secondary)", bd: "transparent" },
  destructive: { bg: "var(--critical)", bgH: "var(--critical-hover)", fg: "var(--text-inverse)", bd: "transparent" },
  ai:        { bg: "var(--ai)", bgH: "var(--ai-hover)", fg: "var(--text-inverse)", bd: "transparent" },
  aiSubtle:  { bg: "var(--ai-tint)", bgH: "var(--ai-tint-strong)", fg: "var(--ai-text)", bd: "var(--ai-border)" },
};
const sizes = {
  sm: { h: "var(--control-h-sm)", px: 10, fs: "var(--text-sm)" },
  md: { h: "var(--control-h-md)", px: 14, fs: "var(--text-base)" },
  lg: { h: "var(--control-h-lg)", px: 18, fs: "var(--text-md)" },
};

export function Button({ variant = "primary", size = "md", disabled, icon, children, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        height: s.h, padding: `0 ${s.px}px`, fontSize: s.fs,
        fontFamily: "var(--font-ui)", fontWeight: "var(--weight-semibold)",
        color: v.fg, background: hover && !disabled ? v.bgH : v.bg,
        border: `1px solid ${v.bd}`, borderRadius: "var(--r-md)",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transition: "background 120ms ease", whiteSpace: "nowrap", ...style,
      }}
      {...rest}
    >
      {icon}{children}
    </button>
  );
}
