/** Content container. `ai` gives the violet-tinted border + shadow reserved for AI-generated content. */
export interface CardProps {
  title?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: number;
  /** AI-content treatment: violet border + soft violet shadow */
  ai?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
