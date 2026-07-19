import { Badge } from "../design/data/Badge";
import type { ConversationDto, ParticipantDto } from "../api/types";
import { useT, type Translate } from "../i18n";

/**
 * Chat-style preview of the by-role parsed consultation: doctors on the left
 * (clinical-blue tint), patients on the right (card surface). Labels are
 * localized client-side from role + index; numbering appears only when a role
 * has several speakers. No violet here — nothing in this view is AI-generated.
 */

function labelOf(t: Translate, conversation: ConversationDto, participant: ParticipantDto): string {
  const base =
    participant.role === "patient" ? t("conversation.patient") : t("conversation.doctor");
  const peers =
    participant.role === "patient" ? conversation.patient_count : conversation.doctor_count;
  return peers > 1 ? `${base} ${participant.index}` : base;
}

export function ConversationPreview({ conversation }: { conversation: ConversationDto }) {
  const t = useT();
  const roster = new Map(conversation.participants.map((p) => [p.key, p]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {conversation.participants.map((p) => (
          <Badge key={p.key} tone={p.role === "doctor" ? "primary" : "neutral"} dot>
            {labelOf(t, conversation, p)}
          </Badge>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: 440,
          overflowY: "auto",
          padding: "2px 2px 4px",
        }}
      >
        {conversation.turns.map((turn, i) => {
          const participant = roster.get(turn.participant);
          const isDoctor = participant?.role !== "patient";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                alignItems: isDoctor ? "flex-start" : "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-semibold)",
                  letterSpacing: "var(--tracking-caps)",
                  textTransform: "uppercase",
                  color: isDoctor ? "var(--primary)" : "var(--text-tertiary)",
                  padding: "0 4px",
                }}
              >
                {participant ? labelOf(t, conversation, participant) : turn.participant}
              </span>
              <div
                style={{
                  maxWidth: "82%",
                  padding: "9px 13px",
                  background: isDoctor ? "var(--primary-tint)" : "var(--surface-card)",
                  border: `1px solid ${isDoctor ? "var(--primary-border)" : "var(--border-strong)"}`,
                  borderRadius: "var(--r-xl)",
                  ...(isDoctor
                    ? { borderTopLeftRadius: "var(--r-sm)" }
                    : { borderBottomRightRadius: "var(--r-sm)" }),
                  fontSize: "var(--text-base)",
                  lineHeight: "var(--leading-normal)",
                  color: "var(--text-primary)",
                }}
              >
                {turn.texts.map((text, j) => (
                  <p key={j} style={{ margin: j === 0 ? 0 : "6px 0 0" }}>
                    {text}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
