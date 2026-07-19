/** Dark toast notification (bottom-right) and hover Tooltip. */
export interface ToastProps {
  tone?: "neutral" | "success" | "critical" | "ai";
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export declare function Toast(props: ToastProps): JSX.Element;
export declare function Tooltip(props: { label: string; children: React.ReactNode }): JSX.Element;
