/** Data table with uppercase overline headers, hover rows, per-column mono/render. */
export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  /** Render cell in IBM Plex Mono (MRN, dates, values) */
  mono?: boolean;
  nowrap?: boolean;
  render?: (row: any) => React.ReactNode;
}
export interface TableProps {
  columns: TableColumn[];
  rows: any[];
  onRowClick?: (row: any) => void;
  dense?: boolean;
}
export declare function Table(props: TableProps): JSX.Element;
