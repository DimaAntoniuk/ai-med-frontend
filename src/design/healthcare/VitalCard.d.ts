/** Single vital-sign tile: mono value, unit, trend arrow, data source + timestamp (human vs device entry). */
export interface VitalCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  status?: "normal" | "warning" | "critical";
  /** Data provenance, e.g. "Nurse entry" or "Device sync" */
  source?: string;
  time?: string;
}
export declare function VitalCard(props: VitalCardProps): JSX.Element;
