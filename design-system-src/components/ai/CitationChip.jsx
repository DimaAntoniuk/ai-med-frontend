import React, { useState } from "react";

export function CitationChip({ index, source, detail, href, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={detail ? `${source} — ${detail}` : source}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: "1px 8px 1px 4px",
        appearance: "none", cursor: "pointer", verticalAlign: "baseline",
        background: hover ? "var(--ai-tint-strong)" : "var(--ai-tint)",
        border: "1px solid var(--ai-border)", borderRadius: "var(--r-full)",
        fontSize: "var(--text-xs)", fontFamily: "var(--font-ui)", color: "var(--ai-text)",
        transition: "background 100ms ease",
      }}>
      <span style={{
        width: 14, height: 14, borderRadius: "50%", background: "var(--ai)", color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 700, fontFamily: "var(--font-mono)",
      }}>{index}</span>
      <span style={{ fontWeight: "var(--weight-semibold)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source}</span>
    </button>
  );
}

export function SourceRow({ index, source, detail, time }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-ui)" }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%", background: "var(--ai)", color: "#fff", flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: 2,
      }}>{index}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{source}</div>
        {detail && <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{detail}</div>}
      </div>
      {time && <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{time}</span>}
    </div>
  );
}
