/** Inline numbered citation chip on AI claims; SourceRow lists the cited sources below. */
export interface CitationChipProps {
  index: number;
  /** e.g. "Lab result 2026-07-12" or "ESC HF Guidelines 2024" */
  source: string;
  detail?: string;
  href?: string;
  onClick?: () => void;
}
export declare function CitationChip(props: CitationChipProps): JSX.Element;
export declare function SourceRow(props: { index: number; source: string; detail?: string; time?: string }): JSX.Element;
