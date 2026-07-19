import React, { useState } from "react";
import { Button } from "../../components/forms/Button.jsx";
import { Input } from "../../components/forms/Input.jsx";
import { Tabs } from "../../components/data/Tabs.jsx";
import { Card } from "../../components/data/Card.jsx";
import { Table } from "../../components/data/Table.jsx";
import { Badge } from "../../components/data/Badge.jsx";
import { Alert } from "../../components/feedback/Alert.jsx";
import { PatientHeader } from "../../components/healthcare/PatientHeader.jsx";
import { PatientListItem } from "../../components/healthcare/PatientListItem.jsx";
import { VitalCard } from "../../components/healthcare/VitalCard.jsx";
import { AIMessage } from "../../components/ai/AIMessage.jsx";
import { CitationChip, SourceRow } from "../../components/ai/CitationChip.jsx";
import { ReviewBar } from "../../components/ai/ReviewBar.jsx";
import { AIBadge } from "../../components/ai/AIBadge.jsx";

const patients = [
  { id: 1, name: "Margaret Okafor", mrn: "4471-0923", age: 65, sex: "F", acuity: "high", reason: "Dyspnea follow-up", time: "09:30", dob: "1961-03-14", allergies: ["Penicillin"], pcp: "Dr. Lindqvist" },
  { id: 2, name: "Jonas Weber", mrn: "4471-1188", age: 54, sex: "M", acuity: "low", reason: "Annual physical", time: "10:15", dob: "1972-01-30", allergies: [], pcp: "Dr. Lindqvist" },
  { id: 3, name: "Amara Diallo", mrn: "4471-0761", age: 71, sex: "F", acuity: "critical", reason: "Post-discharge check", time: "11:00", dob: "1954-09-02", allergies: ["Sulfa"], pcp: "Dr. Meier" },
  { id: 4, name: "Piotr Nowak", mrn: "4471-1340", age: 48, sex: "M", acuity: "moderate", reason: "Hypertension review", time: "11:45", dob: "1978-05-21", allergies: [], pcp: "Dr. Lindqvist" },
];

const meds = [
  { drug: "Furosemide", dose: "80 mg daily", started: "2026-06-28", status: "Active", tone: "success" },
  { drug: "Metformin", dose: "500 mg BID", started: "2024-02-11", status: "Active", tone: "success" },
  { drug: "Lisinopril", dose: "10 mg daily", started: "2023-08-04", status: "Active", tone: "success" },
  { drug: "Ibuprofen", dose: "PRN", started: "2026-05-02", status: "Flagged", tone: "warning" },
];

const labs = [
  { test: "eGFR", value: "52 mL/min", date: "2026-07-12", status: "Abnormal", tone: "warning" },
  { test: "Potassium", value: "5.6 mmol/L", date: "2026-07-12", status: "High", tone: "critical" },
  { test: "HbA1c", value: "6.9 %", date: "2026-07-12", status: "Stable", tone: "success" },
  { test: "NT-proBNP", value: "1,840 pg/mL", date: "2026-07-12", status: "High", tone: "critical" },
];

export function DoctorWorkspace() {
  const [selected, setSelected] = useState(1);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [summaryStatus, setSummaryStatus] = useState("pending");
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState("");
  const p = patients.find((x) => x.id === selected);
  const list = patients.filter((x) => (x.name + x.mrn).toLowerCase().includes(query.toLowerCase()));

  const ask = () => {
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    setChat((c) => [...c, { role: "user", text: t }]);
    setTimeout(() => setChat((c) => [...c, { role: "assistant" }]), 700);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", fontFamily: "var(--font-ui)", minWidth: 1280 }}>
      <aside style={{ width: 290, flexShrink: 0, background: "var(--surface-card)", borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 12, borderBottom: "1px solid var(--border-subtle)" }}>
          <Input placeholder="Name or MRN…" value={query} onChange={(e) => setQuery(e.target.value)} prefix={<span className="icon-search"></span>} />
        </div>
        <div style={{ overflowY: "auto" }}>
          {list.map((x) => (
            <PatientListItem key={x.id} {...x} selected={x.id === selected} onClick={() => { setSelected(x.id); setTab("overview"); setSummaryStatus("pending"); }} />
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: "10px 12px", borderTop: "1px solid var(--border-subtle)", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          Today · {patients.length} scheduled
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <PatientHeader name={p.name} mrn={p.mrn} dob={p.dob} age={p.age} sex={p.sex} acuity={p.acuity}
          allergies={p.allergies} pcp={p.pcp} meta={[{ label: "Visit", value: p.reason }]}
          actions={<Button size="sm" variant="secondary">Schedule follow-up</Button>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <VitalCard label="Blood pressure" value="152/94" unit="mmHg" trend="up" status="warning" source="Device" time="09:41" />
          <VitalCard label="Heart rate" value="78" unit="bpm" trend="flat" source="Device" time="09:41" />
          <VitalCard label="SpO₂" value="94" unit="%" trend="down" status="warning" source="Nurse entry" time="09:32" />
          <VitalCard label="Weight" value="82.4" unit="kg" trend="up" source="Nurse entry" time="09:32" />
        </div>
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: "overview", label: "Overview" },
          { value: "meds", label: "Medications", count: meds.length },
          { value: "labs", label: "Lab results", count: labs.length },
        ]} />
        {tab === "overview" && (
          <Card ai title="Visit preparation — drafted by MedAI"
            action={<AIBadge compact />}>
            <div style={{ fontSize: "var(--text-base)", lineHeight: "var(--leading-normal)", display: "flex", flexDirection: "column", gap: 10 }}>
              <span>
                65-year-old with CHF (NYHA II) here for dyspnea follow-up. Renal function declined since the June diuretic increase — eGFR 63→52{" "}
                <CitationChip index={1} source="Metabolic panel 2026-07-12" /> with K+ 5.6 mmol/L{" "}
                <CitationChip index={1} source="Metabolic panel 2026-07-12" />. NT-proBNP remains elevated{" "}
                <CitationChip index={2} source="Cardiac panel 2026-07-12" />. Consider diuretic down-titration and a renal recheck in 10–14 days.
              </span>
              <div>
                <SourceRow index={1} source="Comprehensive metabolic panel" detail="eGFR 52, K+ 5.6" time="2026-07-12" />
                <SourceRow index={2} source="Cardiac biomarker panel" detail="NT-proBNP 1,840 pg/mL" time="2026-07-12" />
              </div>
              {summaryStatus === "pending"
                ? <ReviewBar approveLabel="Approve & add to note" onApprove={() => setSummaryStatus("approved")} onEdit={() => {}} onReject={() => setSummaryStatus("rejected")} />
                : <ReviewBar status={summaryStatus} reviewer="Dr. Lindqvist" time="09:44" />}
            </div>
          </Card>
        )}
        {tab === "meds" && (
          <Card title="Active medications" padding={0} action={<Button size="sm" variant="secondary">Add medication</Button>}>
            <Alert tone="warning" title="Interaction flagged by MedAI">Ibuprofen may worsen renal function alongside furosemide + lisinopril ("triple whammy").</Alert>
            <Table columns={[
              { key: "drug", label: "Drug" },
              { key: "dose", label: "Dose", mono: true },
              { key: "started", label: "Started", mono: true },
              { key: "status", label: "Status", render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
            ]} rows={meds} onRowClick={() => {}} />
          </Card>
        )}
        {tab === "labs" && (
          <Card title="Recent lab results" padding={0}>
            <Table columns={[
              { key: "test", label: "Test" },
              { key: "value", label: "Value", mono: true, align: "right" },
              { key: "date", label: "Collected", mono: true },
              { key: "status", label: "Status", render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
            ]} rows={labs} onRowClick={() => {}} />
          </Card>
        )}
      </main>

      <aside style={{ width: 360, flexShrink: 0, borderLeft: "1px solid var(--border-subtle)", background: "var(--surface-card)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <AIBadge compact label="MedAI copilot" />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>context: {p.mrn}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {chat.length === 0 && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", textAlign: "center", marginTop: 20 }}>
              Ask about {p.name.split(" ")[0]}'s record, or use a shortcut below.
            </div>
          )}
          {chat.map((m, i) =>
            m.role === "user" ? (
              <AIMessage key={i} role="user">{m.text}</AIMessage>
            ) : (
              <AIMessage key={i} confidence="medium" time="now"
                footer={<SourceRow index={1} source="Record summary" detail="Based on 14 documents" time="09:41" />}>
                Based on the current record <CitationChip index={1} source="Record summary" />, no additional contraindications found. Verify dosing against today's renal function.
              </AIMessage>
            )
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Draft visit note", "Check interactions", "Summarize history"].map((s) => (
              <button key={s} onClick={() => { setChat((c) => [...c, { role: "user", text: s }]); setTimeout(() => setChat((c) => [...c, { role: "assistant" }]), 700); }}
                style={{ appearance: "none", cursor: "pointer", background: "var(--ai-tint)", border: "1px solid var(--ai-border)", color: "var(--ai-text)", borderRadius: "var(--r-full)", padding: "4px 10px", fontSize: "var(--text-xs)", fontFamily: "var(--font-ui)" }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8 }}>
          <span style={{ flex: 1 }}>
            <Input placeholder="Ask MedAI…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} />
          </span>
          <Button variant="ai" onClick={ask}>Ask</Button>
        </div>
      </aside>
    </div>
  );
}
