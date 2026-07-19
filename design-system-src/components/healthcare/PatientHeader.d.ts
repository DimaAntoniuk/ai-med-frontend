/**
 * Horizontal patient banner: identity, acuity pill, mono identifiers, allergies (always red), actions.
 * @startingPoint section="Healthcare" subtitle="Patient identity banner with acuity + allergies" viewport="900x120"
 */
export interface PatientHeaderProps {
  name: string;
  mrn?: string;
  dob?: string;
  age?: number | string;
  sex?: string;
  acuity?: "low" | "moderate" | "high" | "critical";
  /** Allergy names — rendered in critical red, always visible */
  allergies?: string[];
  pcp?: string;
  /** Extra labeled mono values, e.g. [{label:"Visit",value:"Follow-up"}] */
  meta?: { label: string; value: string }[];
  actions?: React.ReactNode;
}
export declare function PatientHeader(props: PatientHeaderProps): JSX.Element;
