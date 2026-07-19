import React from "react";
import { Button } from "../forms/Button.jsx";

export function ReviewBar({ onApprove, onEdit, onReject, approveLabel = "Approve & sign", status, reviewer, time, labels = {} }) {
  const text = {
    pending: "Requires clinician review",
    reject: "Reject",
    edit: "Edit",
    approved: "Approved",
    rejected: "Rejected",
    by: "by",
    ...labels,
  };
  if (status === "approved" || status === "rejected") {
    const ok = status === "approved";
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
        background: ok ? "var(--success-tint)" : "var(--critical-tint)",
        border: `1px solid ${ok ? "var(--success-border)" : "var(--critical-border)"}`,
        borderRadius: "var(--r-md)", fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)",
      }}>
        <span style={{ color: ok ? "var(--success)" : "var(--critical)", fontWeight: "var(--weight-semibold)" }}>
          {ok ? `✓ ${text.approved}` : `✕ ${text.rejected}`}
        </span>
        <span style={{ color: "var(--text-secondary)" }}>
          {reviewer && `${text.by} ${reviewer}`}{time && <span style={{ fontFamily: "var(--font-mono)" }}> · {time}</span>}
        </span>
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
      background: "var(--ai-tint)", border: "1px solid var(--ai-border)",
      borderRadius: "var(--r-md)", fontFamily: "var(--font-ui)",
    }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--ai-text)", fontWeight: "var(--weight-semibold)", flex: 1 }}>
        {text.pending}
      </span>
      {onReject && <Button size="sm" variant="ghost" onClick={onReject}>{text.reject}</Button>}
      {onEdit && <Button size="sm" variant="secondary" onClick={onEdit}>{text.edit}</Button>}
      {onApprove && <Button size="sm" variant="primary" onClick={onApprove}>{approveLabel}</Button>}
    </div>
  );
}
