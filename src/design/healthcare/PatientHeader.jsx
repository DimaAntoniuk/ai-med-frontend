import React from "react";
import { AcuityPill } from "./AcuityPill.jsx";

function Meta({ k, v }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{k}</span>
      <span style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{v}</span>
    </span>
  );
}

export function PatientHeader({ name, mrn, dob, age, sex, acuity, allergies = [], pcp, meta = [], actions }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
      background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
      borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)", fontFamily: "var(--font-ui)",
    }}>
      <span style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: "var(--primary-tint)", color: "var(--primary)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontWeight: "var(--weight-bold)", fontSize: "var(--text-md)",
      }}>{initials}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{name}</span>
          {acuity && <AcuityPill level={acuity} />}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          {[age && `${age} y`, sex, pcp && `PCP: ${pcp}`].filter(Boolean).join(" · ")}
        </span>
      </div>
      <div style={{ display: "flex", gap: 24, flex: 1, flexWrap: "wrap" }}>
        {mrn && <Meta k="MRN" v={mrn} />}
        {dob && <Meta k="DOB" v={dob} />}
        {meta.map((m) => <Meta key={m.label} k={m.label} v={m.value} />)}
        {allergies.length > 0 && (
          <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--critical)" }}>Allergies</span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--critical)", fontWeight: "var(--weight-semibold)" }}>{allergies.join(", ")}</span>
          </span>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}
