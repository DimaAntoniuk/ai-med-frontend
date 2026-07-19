/** 3-bar AI confidence indicator. Low always reads "verify". */
export interface ConfidenceMeterProps {
  level: "high" | "medium" | "low";
  showLabel?: boolean;
  /** Localized label overrides per level */
  labels?: { high?: string; medium?: string; low?: string };
}
export declare function ConfidenceMeter(props: ConfidenceMeterProps): JSX.Element;
