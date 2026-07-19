/** 3-bar AI confidence indicator. Low always reads "verify". */
export interface ConfidenceMeterProps {
  level: "high" | "medium" | "low";
  showLabel?: boolean;
}
export declare function ConfidenceMeter(props: ConfidenceMeterProps): JSX.Element;
