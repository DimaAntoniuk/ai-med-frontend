/** Human-in-the-loop bar under AI output: Reject / Edit / Approve & sign. Shows resolved state with reviewer + timestamp. */
export interface ReviewBarProps {
  onApprove?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
  approveLabel?: string;
  status?: "pending" | "approved" | "rejected";
  reviewer?: string;
  time?: string;
}
export declare function ReviewBar(props: ReviewBarProps): JSX.Element;
