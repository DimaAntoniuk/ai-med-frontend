import React, { useState } from "react";

export function Table({ columns = [], rows = [], onRowClick, dense }) {
  const [hovered, setHovered] = useState(null);
  const py = dense ? 8 : 12;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)" }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={{
              textAlign: c.align || "left", padding: `8px 12px`,
              fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)",
              letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
              color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-strong)",
              whiteSpace: "nowrap",
            }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            style={{
              cursor: onRowClick ? "pointer" : "default",
              background: hovered === i && onRowClick ? "var(--n-50)" : "transparent",
              transition: "background 100ms ease",
            }}>
            {columns.map((c) => (
              <td key={c.key} style={{
                padding: `${py}px 12px`, textAlign: c.align || "left",
                borderBottom: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontFamily: c.mono ? "var(--font-mono)" : "var(--font-ui)",
                whiteSpace: c.nowrap ? "nowrap" : "normal",
              }}>{c.render ? c.render(r) : r[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
