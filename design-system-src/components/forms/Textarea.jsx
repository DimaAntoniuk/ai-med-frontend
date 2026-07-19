import React, { useState } from "react";
import { Field } from "./Input.jsx";

export function Textarea({ label, hint, error, required, rows = 4, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <textarea
        rows={rows}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          padding: "10px 12px", resize: "vertical",
          background: rest.disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          border: `1.5px solid ${error ? "var(--critical)" : focus ? "var(--primary)" : "var(--border-strong)"}`,
          borderRadius: "var(--r-md)", boxShadow: focus ? "var(--ring)" : "none", outline: "none",
          fontSize: "var(--text-base)", fontFamily: "var(--font-ui)", color: "var(--text-primary)",
          lineHeight: "var(--leading-normal)", transition: "box-shadow 120ms ease", ...style,
        }}
        {...rest}
      />
    </Field>
  );
}
