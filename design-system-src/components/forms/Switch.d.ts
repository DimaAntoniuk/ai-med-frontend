/** Toggle switch for immediate-effect binary settings. */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (e: any) => void;
  label?: string;
  disabled?: boolean;
}
export declare function Switch(props: SwitchProps): JSX.Element;
