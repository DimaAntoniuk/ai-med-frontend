/**
 * Primary action trigger. Variants map to intent: `primary` (indigo) for the main
 * user action, `secondary`/`ghost` for the rest, `destructive` for irreversible acts,
 * `ai`/`aiSubtle` ONLY for actions that invoke or accept AI output.
 * @startingPoint section="Forms" subtitle="Buttons in all variants and sizes" viewport="700x220"
 */
export interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "ai" | "aiSubtle";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Optional leading icon node (16px) */
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: (e: any) => void;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
