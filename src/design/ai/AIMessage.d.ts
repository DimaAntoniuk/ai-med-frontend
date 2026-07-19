/** Chat bubble pair: user (solid indigo, right) and MedAI (violet-bordered card, left, with badge + confidence). */
export interface AIMessageProps {
  role?: "user" | "assistant";
  confidence?: "high" | "medium" | "low";
  time?: string;
  /** Sources list, ReviewBar, or follow-up chips */
  footer?: React.ReactNode;
  children: React.ReactNode;
}
export declare function AIMessage(props: AIMessageProps): JSX.Element;
