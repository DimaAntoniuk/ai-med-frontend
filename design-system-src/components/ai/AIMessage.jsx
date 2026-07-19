import React from "react";
import { AIBadge } from "./AIBadge.jsx";
import { ConfidenceMeter } from "./ConfidenceMeter.jsx";

export function AIMessage({ role = "assistant", confidence, time, footer, children }) {
  if (role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", fontFamily: "var(--font-ui)" }}>
        <div style={{
          maxWidth: "78%", padding: "10px 14px", background: "var(--primary)",
          color: "var(--text-inverse)", borderRadius: "var(--r-xl)",
          borderBottomRightRadius: "var(--r-sm)", fontSize: "var(--text-base)",
          lineHeight: "var(--leading-normal)",
        }}>{children}</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--font-ui)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AIBadge compact label="MedAI" />
        {confidence && <ConfidenceMeter level={confidence} />}
        {time && <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{time}</span>}
      </div>
      <div style={{
        padding: "12px 16px", background: "var(--surface-card)",
        border: "1px solid var(--ai-border)", borderRadius: "var(--r-xl)",
        borderTopLeftRadius: "var(--r-sm)", boxShadow: "var(--shadow-ai)",
        fontSize: "var(--text-base)", lineHeight: "var(--leading-normal)", color: "var(--text-primary)",
      }}>
        {children}
        {footer && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>{footer}</div>}
      </div>
    </div>
  );
}
