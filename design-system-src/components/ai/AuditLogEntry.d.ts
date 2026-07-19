/** Timeline entry for the AI audit trail: who/what/when with mono event ID. */
export interface AuditLogEntryProps {
  kind?: "ai" | "approve" | "reject" | "edit" | "access" | "system";
  actor: string;
  action: string;
  target?: string;
  time: string;
  /** Mono event id, e.g. "EV-88213" */
  id?: string;
  /** Set on the final entry to end the timeline rail */
  last?: boolean;
}
export declare function AuditLogEntry(props: AuditLogEntryProps): JSX.Element;
