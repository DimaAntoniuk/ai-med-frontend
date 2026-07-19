import React, { useState } from "react";
import { Button } from "../../components/forms/Button.jsx";
import { Card } from "../../components/data/Card.jsx";
import { Table } from "../../components/data/Table.jsx";
import { Badge } from "../../components/data/Badge.jsx";
import { Alert } from "../../components/feedback/Alert.jsx";
import { ConfidenceMeter } from "../../components/ai/ConfidenceMeter.jsx";
import { AuditLogEntry } from "../../components/ai/AuditLogEntry.jsx";

function Kpi({ label, value, unit, delta, deltaTone = "success" }) {
  return (
    <Card padding={16}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
        <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", fontFamily: "var(--font-mono)", lineHeight: 1.1 }}>{value}</span>
          {unit && <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{unit}</span>}
        </span>
        {delta && <Badge tone={deltaTone}>{delta}</Badge>}
      </div>
    </Card>
  );
}

const initialQueue = [
  { id: "Q-104", item: "Discharge summary — A. Diallo", clinician: "Dr. Meier", conf: "low", created: "08:52", status: "Pending" },
  { id: "Q-103", item: "Treatment suggestion — M. Okafor", clinician: "Dr. Lindqvist", conf: "medium", created: "09:41", status: "Pending" },
  { id: "Q-102", item: "Visit note — J. Weber", clinician: "Dr. Lindqvist", conf: "high", created: "10:20", status: "Pending" },
  { id: "Q-101", item: "Triage classification — P. Nowak", clinician: "Triage queue", conf: "high", created: "07:15", status: "Approved" },
];

export function AdminDashboard() {
  const [queue, setQueue] = useState(initialQueue);
  const resolve = (id, status) => setQueue((q) => q.map((r) => (r.id === id ? { ...r, status } : r)));

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, fontFamily: "var(--font-ui)", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
      <Alert tone="ai" title="Oversight mode — read-only clinical data">
        You are observing AI activity for compliance purposes. Patient records open in audit view only (EU AI Act, Art. 14 — human oversight).
      </Alert>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Kpi label="AI drafts today" value="142" delta="+12% vs last week" />
        <Kpi label="Approval rate" value="94.2" unit="%" delta="+1.1 pt" />
        <Kpi label="Median review time" value="38" unit="sec" delta="−6 sec" />
        <Kpi label="Escalations" value="3" delta="2 open" deltaTone="warning" />
      </div>
      <Card title="Review queue — items awaiting clinician sign-off" padding={0}
        action={<Badge tone="warning" dot>{queue.filter((r) => r.status === "Pending").length} pending</Badge>}>
        <Table columns={[
          { key: "id", label: "ID", mono: true },
          { key: "item", label: "Item" },
          { key: "clinician", label: "Assigned to" },
          { key: "conf", label: "AI confidence", render: (r) => <ConfidenceMeter level={r.conf} /> },
          { key: "created", label: "Created", mono: true },
          { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "Approved" ? "success" : r.status === "Escalated" ? "critical" : "warning"} dot>{r.status}</Badge> },
          { key: "actions", label: "", align: "right", render: (r) => r.status === "Pending" && (
              <span style={{ display: "inline-flex", gap: 6 }}>
                <Button size="sm" variant="ghost" onClick={() => resolve(r.id, "Escalated")}>Escalate</Button>
                <Button size="sm" variant="secondary" onClick={() => resolve(r.id, "Approved")}>Mark reviewed</Button>
              </span>
            ) },
        ]} rows={queue} />
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card title="Audit trail — latest AI events">
          <AuditLogEntry kind="ai" actor="MedAI" action="drafted discharge summary" target="A. Diallo" time="08:52:11" id="EV-88201" />
          <AuditLogEntry kind="edit" actor="Dr. Meier" action="edited AI draft before signing" target="A. Diallo" time="09:02:47" id="EV-88204" />
          <AuditLogEntry kind="ai" actor="MedAI" action="suggested diuretic down-titration" target="M. Okafor" time="09:41:07" id="EV-88213" />
          <AuditLogEntry kind="approve" actor="Dr. Lindqvist" action="approved & signed the suggestion" time="09:44:52" id="EV-88214" />
          <AuditLogEntry kind="access" actor="Admin C. Baumann" action="opened oversight dashboard" time="10:01:33" id="EV-88220" last />
        </Card>
        <Card title="Model & data governance">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "var(--text-sm)" }}>
            {[
              ["Model version", "medai-clinical-2.4.1"],
              ["Last conformity assessment", "2026-05-30"],
              ["Data retention", "10 years (GDPR Art. 9(2)(h))"],
              ["Human oversight", "Mandatory sign-off on all outputs"],
              ["Incident reports (30 d)", "0"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{k}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{v}</span>
              </div>
            ))}
            <Button variant="secondary" size="sm" style={{ alignSelf: "flex-start" }}>Export compliance report</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
