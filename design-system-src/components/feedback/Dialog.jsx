import React from "react";

export function Dialog({ open, title, subtitle, footer, width = 480, onClose, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "oklch(0.21 0.018 264 / 0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24,
    }}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{
        width, maxWidth: "100%", maxHeight: "90vh", overflow: "auto",
        background: "var(--surface-card)", borderRadius: "var(--r-xl)",
        boxShadow: "var(--shadow-lg)", fontFamily: "var(--font-ui)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{title}</div>
            {subtitle && <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 4 }}>{subtitle}</div>}
          </div>
          {onClose && <button onClick={onClose} aria-label="Close" style={{ appearance: "none", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 18, lineHeight: 1, padding: 4, height: 28 }}>×</button>}
        </div>
        <div style={{ padding: "16px 24px 24px", flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end", gap: 10, background: "var(--n-25)" }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
