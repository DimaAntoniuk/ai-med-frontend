import React, { useState } from "react";

export function IconButton({ size = "md", variant = "ghost", disabled, "aria-label": ariaLabel, children, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const dim = { sm: 28, md: 36, lg: 44 }[size] || 36;
  const solid = variant === "secondary";
  return (
    <button
      aria-label={ariaLabel} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: dim, height: dim, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: hover && !disabled ? "var(--n-100)" : solid ? "var(--surface-card)" : "transparent",
        border: solid ? "1px solid var(--border-strong)" : "1px solid transparent",
        borderRadius: "var(--r-md)", color: "var(--text-secondary)", fontSize: 16,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transition: "background 120ms ease", ...style,
      }}
      {...rest}
    >{children}</button>
  );
}
