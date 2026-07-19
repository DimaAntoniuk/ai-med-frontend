import React, { useState } from "react";

export function Field({ label, hint, error, required, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--font-ui)" }}>
      {label && (
        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>
          {label}{required && <span style={{ color: "var(--critical)" }}> *</span>}
        </span>
      )}
      {children}
      {(error || hint) && (
        <span style={{ fontSize: "var(--text-sm)", color: error ? "var(--critical)" : "var(--text-tertiary)" }}>
          {error || hint}
        </span>
      )}
    </label>
  );
}

export function Input({ label, hint, error, required, mono, prefix, suffix, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <span style={{
        display: "flex", alignItems: "center", gap: 8, height: "var(--control-h-md)",
        padding: "0 12px", background: rest.disabled ? "var(--surface-sunken)" : "var(--surface-card)",
        border: `1.5px solid ${error ? "var(--critical)" : focus ? "var(--primary)" : "var(--border-strong)"}`,
        borderRadius: "var(--r-md)", boxShadow: focus ? (error ? "var(--ring-critical)" : "var(--ring)") : "none",
        transition: "box-shadow 120ms ease, border-color 120ms ease",
      }}>
        {prefix && <span style={{ color: "var(--text-tertiary)", fontSize: 15, display: "inline-flex" }}>{prefix}</span>}
        <input
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
            fontSize: "var(--text-base)", color: "var(--text-primary)",
            fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)", ...style,
          }}
          {...rest}
        />
        {suffix && <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>{suffix}</span>}
      </span>
    </Field>
  );
}
