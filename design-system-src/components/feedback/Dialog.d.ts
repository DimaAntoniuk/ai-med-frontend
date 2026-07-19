/** Modal dialog with title, optional subtitle, and right-aligned footer actions. */
export interface DialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  width?: number;
  onClose?: () => void;
  children: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element;
