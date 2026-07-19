/** Multi-line text input for notes and free-text clinical documentation. */
export interface TextareaProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (e: any) => void;
  style?: React.CSSProperties;
}
export declare function Textarea(props: TextareaProps): JSX.Element;
