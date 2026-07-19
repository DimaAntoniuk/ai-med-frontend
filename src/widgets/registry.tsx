import type { ComponentType } from "react";
import { Card } from "../design/data/Card";

/**
 * Lego-block widget system: the backend agent controls the UI by emitting
 * typed JSON blocks; each block type maps to a registered widget. Unknown
 * types degrade to a raw-JSON fallback instead of breaking the stream.
 */
export interface WidgetDescriptor {
  /** Registry key — e.g. "differential", "gap_analysis", "treatment", "text" */
  type: string;
  /** Widget-specific JSON payload, exactly as the agent emitted it */
  payload: unknown;
  /** Stable identity for React lists / replacement semantics */
  id: string;
}

export interface WidgetProps<P = unknown> {
  payload: P;
  descriptor: WidgetDescriptor;
}

const registry = new Map<string, ComponentType<WidgetProps<never>>>();

export function registerWidget<P>(type: string, component: ComponentType<WidgetProps<P>>) {
  registry.set(type, component as ComponentType<WidgetProps<never>>);
}

export function isRegistered(type: string): boolean {
  return registry.has(type);
}

function FallbackWidget({ descriptor }: WidgetProps) {
  return (
    <Card title={`Unrecognized block — ${descriptor.type}`}>
      <pre
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "var(--text-secondary)",
        }}
      >
        {JSON.stringify(descriptor.payload, null, 2)}
      </pre>
    </Card>
  );
}

export function WidgetView({ descriptor }: { descriptor: WidgetDescriptor }) {
  const Component = registry.get(descriptor.type) ?? FallbackWidget;
  return <Component payload={descriptor.payload as never} descriptor={descriptor} />;
}
