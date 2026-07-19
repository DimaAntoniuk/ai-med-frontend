/** Inline alert banner. `critical` for clinical safety issues; `ai` for AI-related notices. */
export interface AlertProps {
  tone?: "info" | "success" | "warning" | "critical" | "ai";
  title?: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
  children: React.ReactNode;
}
export declare function Alert(props: AlertProps): JSX.Element;
