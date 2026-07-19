/** Row for patient look-up lists / sidebars: name + compact acuity, mono MRN, reason, time. */
export interface PatientListItemProps {
  name: string;
  mrn?: string;
  age?: number | string;
  sex?: string;
  acuity?: "low" | "moderate" | "high" | "critical";
  /** Chief reason for visit */
  reason?: string;
  time?: string;
  selected?: boolean;
  onClick?: () => void;
}
export declare function PatientListItem(props: PatientListItemProps): JSX.Element;
