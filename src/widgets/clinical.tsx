import { useState } from "react";
import { Badge, Tag } from "../design/data/Badge";
import { Alert } from "../design/feedback/Alert";
import { ReviewBar } from "../design/ai/ReviewBar";
import type { WidgetProps } from "./registry";
import {
  AIBlockCard,
  ConfidenceRow,
  Overline,
  SourceList,
  asNum,
  asObjArray,
  asStr,
  asStrArray,
} from "./parts";

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item) => (
        <li key={item} style={{ fontSize: "var(--text-base)", lineHeight: "var(--leading-normal)" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Top-3 differential diagnosis with dual (diagnostic + evidence) confidence. */
export function DifferentialWidget({ payload }: WidgetProps) {
  const data = payload as Record<string, unknown>;
  const items = asObjArray(data?.differentials);
  return (
    <AIBlockCard title="Differential diagnosis">
      {items.length === 0 && (
        <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
          MedAI returned no differentials for this transcript.
        </span>
      )}
      {items.map((item, i) => {
        const name = asStr(item.name, "Unnamed differential");
        const icd10 = asStr(item.icd10);
        const sources = asStrArray(item.sources);
        return (
          <div
            key={`${name}-${i}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              paddingBottom: 14,
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                }}
              >
                {i + 1}.
              </span>
              <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)" }}>
                {name}
              </span>
              {icd10 && (
                <Tag style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                  ICD-10 {icd10}
                </Tag>
              )}
            </div>
            <ConfidenceRow
              label="Diagnostic"
              score={asNum(item.diagnostic_confidence)}
              rationale={asStr(item.diagnostic_rationale)}
            />
            <ConfidenceRow
              label="Evidence"
              score={asNum(item.evidence_confidence)}
              rationale={asStr(item.evidence_rationale)}
            />
            <SourceList sources={sources} />
          </div>
        );
      })}
    </AIBlockCard>
  );
}

/** Red flags, unasked questions, and recommended tests. */
export function GapAnalysisWidget({ payload }: WidgetProps) {
  const data = payload as Record<string, unknown>;
  const redFlags = asStrArray(data?.red_flags);
  const missingQuestions = asStrArray(data?.missing_questions);
  const recommendedTests = asStrArray(data?.recommended_tests);
  return (
    <AIBlockCard title="Gap analysis" footer={<SourceList sources={asStrArray(data?.sources)} />}>
      {redFlags.length > 0 && (
        <Alert tone="critical" title="Red flags">
          <BulletList items={redFlags} />
        </Alert>
      )}
      {missingQuestions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Overline>Questions not yet asked</Overline>
          <BulletList items={missingQuestions} />
        </div>
      )}
      {recommendedTests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Overline>Recommended tests</Overline>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {recommendedTests.map((test) => (
              <Tag key={test}>{test}</Tag>
            ))}
          </div>
        </div>
      )}
      {redFlags.length + missingQuestions.length + recommendedTests.length === 0 && (
        <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
          MedAI found no gaps to report.
        </span>
      )}
    </AIBlockCard>
  );
}

/**
 * Treatment plan — the actionable block, so it is gated by ReviewBar.
 * Review state is client-side only in this POC (no accept endpoint yet).
 */
export function TreatmentWidget({ payload }: WidgetProps) {
  const data = payload as Record<string, unknown>;
  const [review, setReview] = useState<"pending" | "approved" | "rejected">("pending");
  const planType = asStr(data?.plan_type, "preliminary");
  const steps = asStrArray(data?.steps);
  const rationale = asStr(data?.rationale);
  const reviewedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <AIBlockCard
      title="Treatment plan"
      footer={
        review === "pending" ? (
          <ReviewBar
            approveLabel="Approve plan"
            onApprove={() => setReview("approved")}
            onReject={() => setReview("rejected")}
          />
        ) : (
          <ReviewBar status={review} reviewer="Clinician" time={reviewedAt} />
        )
      }
    >
      <div>
        <Badge tone={planType === "final" ? "success" : "warning"} dot>
          {planType === "final" ? "Final plan" : "Preliminary plan"}
        </Badge>
      </div>
      {steps.length > 0 && (
        <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          {steps.map((step) => (
            <li key={step} style={{ fontSize: "var(--text-base)", lineHeight: "var(--leading-normal)" }}>
              {step}
            </li>
          ))}
        </ol>
      )}
      {rationale && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Overline>Rationale</Overline>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{rationale}</span>
        </div>
      )}
      <SourceList sources={asStrArray(data?.sources)} />
    </AIBlockCard>
  );
}
