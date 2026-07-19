/** Square icon-only button for toolbars and table rows. Always set aria-label. */
export interface IconButtonProps {
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "secondary";
  disabled?: boolean;
  "aria-label": string;
  children: React.ReactNode;
  onClick?: (e: any) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
