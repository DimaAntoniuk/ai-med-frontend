/** Patient acuity / risk-level pill: low | moderate | high | critical. */
export interface AcuityPillProps {
  level: "low" | "moderate" | "high" | "critical";
  /** Override label text (default: capitalized level) */
  label?: string;
}
export declare function AcuityPill(props: AcuityPillProps): JSX.Element;
