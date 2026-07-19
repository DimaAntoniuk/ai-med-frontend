/** Native select styled to match Input. */
export interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  value?: string;
  disabled?: boolean;
  onChange?: (e: any) => void;
  style?: React.CSSProperties;
}
export declare function Select(props: SelectProps): JSX.Element;
