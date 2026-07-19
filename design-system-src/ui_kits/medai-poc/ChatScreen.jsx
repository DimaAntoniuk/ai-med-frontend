import React, { useState, useRef, useEffect } from "react";
import { Button } from "../../components/forms/Button.jsx";
import { Input } from "../../components/forms/Input.jsx";
import { AIMessage } from "../../components/ai/AIMessage.jsx";
import { CitationChip, SourceRow } from "../../components/ai/CitationChip.jsx";
import { ReviewBar } from "../../components/ai/ReviewBar.jsx";
import { AIBadge } from "../../components/ai/AIBadge.jsx";
import { PatientHeader } from "../../components/healthcare/PatientHeader.jsx";
import { Badge, Tag } from "../../components/data/Badge.jsx";

const cannedReplies = [
  {
    confidence: "high",
    body: (k) => (
      <span>
        Margaret's renal function has declined: eGFR fell from 63 to 52 mL/min over 3 months{" "}
        <CitationChip index={1} source="Metabolic panel 2026-07-12" />, coinciding with the furosemide increase on June 28{" "}
        <CitationChip index={2} source="Visit note 2026-06-28" />. Potassium is now 5.6 mmol/L — above range.
      </span>
    ),
    sources: [
      { index: 1, source: "Comprehensive metabolic panel", detail: "eGFR 52 mL/min/1.73m², K+ 5.6 mmol/L", time: "2026-07-12" },
      { index: 2, source: "Visit note — Dr. Lindqvist", detail: "Furosemide 40→80 mg daily", time: "2026-06-28" },
    ],
    reviewable: false,
  },
  {
    confidence: "medium",
    body: () => (
      <span>
        Draft plan: reduce furosemide to 40 mg daily, recheck renal panel and potassium in 10–14 days{" "}
        <CitationChip index={1} source="ESC HF Guidelines 2024" />, and hold potassium-sparing agents until K+ normalizes.
      </span>
    ),
    sources: [{ index: 1, source: "ESC Heart Failure Guidelines", detail: "Section 11.3 — diuretic titration in CKD", time: "2024" }],
    reviewable: true,
  },
];

export function ChatScreen() {
  const [messages, setMessages] = useState([
    { role: "assistant", reply: cannedReplies[0], time: "09:41", status: "none" },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);
  const nextReply = useRef(1);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const send = (text) => {
    const t = (text || draft).trim();
    if (!t) return;
    setDraft("");
    setMessages((m) => [...m, { role: "user", text: t }]);
    setThinking(true);
    setTimeout(() => {
      const reply = cannedReplies[nextReply.current % cannedReplies.length];
      nextReply.current += 1;
      setThinking(false);
      setMessages((m) => [...m, { role: "assistant", reply, time: "09:4" + (2 + (m.length % 7)), status: reply.reviewable ? "pending" : "none" }]);
    }, 900);
  };
  const setStatus = (i, status) => setMessages((m) => m.map((msg, j) => (j === i ? { ...msg, status } : msg)));

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-page)", fontFamily: "var(--font-ui)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 24px", height: 56, background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <span style={{ fontSize: 18, fontWeight: "var(--weight-bold)", letterSpacing: "-0.02em" }}>Med<span style={{ color: "var(--ai)" }}>AI</span></span>
        <Badge tone="ai">Clinical assistant — POC</Badge>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Dr. Anna Lindqvist</span>
        <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary-tint)", color: "var(--primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>AL</span>
      </header>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", maxWidth: 800, width: "100%", margin: "0 auto", padding: "16px 24px 20px", gap: 12 }}>
        <PatientHeader name="Margaret Okafor" mrn="4471-0923" dob="1961-03-14" age={65} sex="F" acuity="high" allergies={["Penicillin"]} pcp="Dr. Lindqvist" />
        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "4px 2px" }}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <AIMessage key={i} role="user">{m.text}</AIMessage>
            ) : (
              <AIMessage key={i} confidence={m.reply.confidence} time={m.time}
                footer={
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>{m.reply.sources.map((s) => <SourceRow key={s.index} {...s} />)}</div>
                    {m.status !== "none" && (
                      m.status === "pending"
                        ? <ReviewBar approveLabel="Add to chart" onApprove={() => setStatus(i, "approved")} onEdit={() => {}} onReject={() => setStatus(i, "rejected")} />
                        : <ReviewBar status={m.status} reviewer="Dr. Lindqvist" time="09:44" />
                    )}
                  </div>
                }>
                {m.reply.body()}
              </AIMessage>
            )
          )}
          {thinking && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AIBadge compact label="MedAI" />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>Reading the record…</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Summarize renal function", "Draft a visit note", "Any medication interactions?"].map((s) => (
            <button key={s} onClick={() => send(s)} style={{ appearance: "none", cursor: "pointer", background: "var(--ai-tint)", border: "1px solid var(--ai-border)", color: "var(--ai-text)", borderRadius: "var(--r-full)", padding: "5px 12px", fontSize: "var(--text-sm)", fontFamily: "var(--font-ui)" }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ flex: 1 }}>
            <Input placeholder="Ask MedAI about this patient…" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
          </span>
          <Button variant="ai" onClick={() => send()}>Send</Button>
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textAlign: "center" }}>
          AI-generated content — verify before clinical use. Interactions are logged for oversight (EU AI Act, Art. 13).
        </div>
      </div>
    </div>
  );
}
