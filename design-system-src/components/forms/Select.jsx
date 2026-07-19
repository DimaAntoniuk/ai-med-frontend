import React, { useState } from "react";
import { Field } from "./Input.jsx";

export function Select({ label, hint, error, required, options = [], style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <span style={{ position: "relative", display: "flex" }}>
        <select
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: "100%", height: "var(--control-h-md)", padding: "0 32px 0 12px",
            appearance: "none", WebkitAppearance: "none",
            background: rest.disabled ? "var(--surface-sunken)" : "var(--surface-card)",
            border: `1.5px solid ${error ? "var(--critical)" : focus ? "var(--primary)" : "var(--border-strong)"}`,
            borderRadius: "var(--r-md)", boxShadow: focus ? "var(--ring)" : "none",
            fontSize: "var(--text-base)", fontFamily: "var(--font-ui)", color: "var(--text-primary)",
            cursor: "pointer", transition: "box-shadow 120ms ease", ...style,
          }}
          {...rest}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-tertiary)", fontSize: 11 }}>▾</span>
      </span>
    </Field>
  );
}
