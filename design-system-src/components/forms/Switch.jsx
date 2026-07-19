import React from "react";

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label style={{ display: "inline-flex", gap: 10, alignItems: "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, fontFamily: "var(--font-ui)" }}>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0 }} />
      <span style={{
        width: 36, height: 21, borderRadius: "var(--r-full)", padding: 2,
        background: checked ? "var(--primary)" : "var(--n-300)",
        transition: "background 150ms ease", display: "inline-flex",
      }}>
        <span style={{
          width: 17, height: 17, borderRadius: "50%", background: "#fff",
          boxShadow: "var(--shadow-xs)", transition: "transform 150ms ease",
          transform: checked ? "translateX(15px)" : "translateX(0)",
        }} />
      </span>
      {label && <span style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
