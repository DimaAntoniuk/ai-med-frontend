/** Text input with label, hint/error, optional prefix icon and suffix unit. Set mono for MRNs, dosages, values. */
export interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** IBM Plex Mono value text — use for MRN, dosage, vitals */
  mono?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (e: any) => void;
  style?: React.CSSProperties;
  /** Remaining props are spread onto the native <input> */
  [rest: string]: any;
}
export declare function Input(props: InputProps): JSX.Element;
export declare function Field(props: { label?: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode }): JSX.Element;
