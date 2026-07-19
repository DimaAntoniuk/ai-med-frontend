import React, { useState } from "react";
import { AcuityPill } from "./AcuityPill.jsx";

export function PatientListItem({ name, mrn, age, sex, acuity, reason, time, selected, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        padding: "10px 12px", appearance: "none", cursor: "pointer",
        background: selected ? "var(--primary-tint)" : hover ? "var(--n-50)" : "transparent",
        border: "none", borderLeft: `3px solid ${selected ? "var(--primary)" : "transparent"}`,
        fontFamily: "var(--font-ui)", transition: "background 100ms ease",
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          {acuity && <AcuityPill level={acuity} label={{ low: "L", moderate: "M", high: "H", critical: "C" }[acuity]} />}
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: "var(--font-mono)" }}>{mrn}</span>
          {(age || sex) && ` · ${[age && `${age}y`, sex].filter(Boolean).join(" ")}`}
          {reason && ` · ${reason}`}
        </div>
      </div>
      {time && <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", flexShrink: 0 }}>{time}</span>}
    </button>
  );
}
