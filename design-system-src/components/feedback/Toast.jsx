import React from "react";

export function Toast({ tone = "neutral", title, description, action }) {
  const fg = { neutral: "var(--n-300)", success: "var(--success)", critical: "var(--critical)", ai: "var(--ai)" }[tone] || "var(--n-300)";
  return (
    <div role="status" style={{
      display: "flex", gap: 10, alignItems: "flex-start", width: 360, padding: "12px 14px",
      background: "var(--surface-inverse)", color: "var(--text-inverse)",
      borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)", fontFamily: "var(--font-ui)",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: fg, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }}>{title}</div>
        {description && <div style={{ fontSize: "var(--text-sm)", color: "var(--n-300)", marginTop: 2 }}>{description}</div>}
      </div>
      {action}
    </div>
  );
}

export function Tooltip({ label, children }) {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "var(--surface-inverse)", color: "var(--text-inverse)",
          fontSize: "var(--text-xs)", fontFamily: "var(--font-ui)", padding: "5px 9px",
          borderRadius: "var(--r-sm)", whiteSpace: "nowrap", boxShadow: "var(--shadow-md)", zIndex: 50,
        }}>{label}</span>
      )}
    </span>
  );
}
