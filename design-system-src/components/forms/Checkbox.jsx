import React from "react";

function Box({ checked, round }) {
  return (
    <span style={{
      width: 18, height: 18, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
      borderRadius: round ? "50%" : 5,
      border: `1.5px solid ${checked ? "var(--primary)" : "var(--border-strong)"}`,
      background: checked && !round ? "var(--primary)" : "var(--surface-card)",
      transition: "all 120ms ease",
    }}>
      {checked && !round && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.7 9L10 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      {checked && round && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--primary)" }} />}
    </span>
  );
}

function Row({ checked, onChange, label, description, disabled, round, name }) {
  return (
    <label style={{ display: "flex", gap: 10, alignItems: description ? "flex-start" : "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, fontFamily: "var(--font-ui)" }}>
      <input type={round ? "radio" : "checkbox"} name={name} checked={!!checked} disabled={disabled} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0 }} />
      <Box checked={checked} round={round} />
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{label}</span>
        {description && <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{description}</span>}
      </span>
    </label>
  );
}

export function Checkbox(props) { return <Row {...props} />; }

export function RadioGroup({ name, options = [], value, onChange, direction = "column" }) {
  return (
    <div style={{ display: "flex", flexDirection: direction, gap: direction === "column" ? 10 : 20 }}>
      {options.map((o) => (
        <Row key={o.value} round name={name} label={o.label} description={o.description}
          checked={value === o.value} disabled={o.disabled}
          onChange={() => onChange && onChange(o.value)} />
      ))}
    </div>
  );
}
