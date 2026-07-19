import React from "react";

const kinds = {
  ai:       { label: "AI action", color: "var(--ai)" },
  approve:  { label: "Approved", color: "var(--success)" },
  reject:   { label: "Rejected", color: "var(--critical)" },
  edit:     { label: "Edited", color: "var(--warning)" },
  access:   { label: "Access", color: "var(--info)" },
  system:   { label: "System", color: "var(--n-400)" },
};

export function AuditLogEntry({ kind = "system", actor, action, target, time, id, last }) {
  const k = kinds[kind] || kinds.system;
  return (
    <div style={{ display: "flex", gap: 12, fontFamily: "var(--font-ui)", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: k.color, marginTop: 5, border: "2px solid #fff", boxShadow: "0 0 0 1px var(--border-subtle)" }} />
        {!last && <span style={{ width: 2, flex: 1, background: "var(--border-subtle)", marginTop: 2 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 16, flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: k.color }}>{k.label}</span>
          <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{time}{id && ` · ${id}`}</span>
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", marginTop: 2 }}>
          <b style={{ fontWeight: "var(--weight-semibold)" }}>{actor}</b> {action}
          {target && <span style={{ color: "var(--text-secondary)" }}> — {target}</span>}
        </div>
      </div>
    </div>
  );
}
