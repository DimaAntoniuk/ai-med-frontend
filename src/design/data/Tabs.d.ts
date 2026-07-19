/** Underline tabs with optional mono count badges. */
export interface TabsProps {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}
export declare function Tabs(props: TabsProps): JSX.Element;
