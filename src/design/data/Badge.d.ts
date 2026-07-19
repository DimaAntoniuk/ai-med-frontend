/** Status pill. `ai` tone marks AI-generated items. Tag is a removable filter chip. */
export interface BadgeProps {
  tone?: "neutral" | "primary" | "success" | "warning" | "critical" | "info" | "ai";
  dot?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
export declare function Tag(props: { children: React.ReactNode; onRemove?: () => void; style?: React.CSSProperties }): JSX.Element;
