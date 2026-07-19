/** Checkbox with optional description line. */
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (e: any) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
export declare function RadioGroup(props: {
  name: string;
  options: { value: string; label: string; description?: string; disabled?: boolean }[];
  value?: string;
  onChange?: (value: string) => void;
  direction?: "column" | "row";
}): JSX.Element;
