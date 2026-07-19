import { Alert } from "../design/feedback/Alert";
import { Card } from "../design/data/Card";
import { Table } from "../design/data/Table";
import type { WidgetProps } from "./registry";
import { AIBlockCard, Overline, asObjArray, asStr, asStrArray } from "./parts";

/**
 * Generic lego blocks. The agent doesn't emit these kinds yet, but registering
 * them means new backend `present` kinds can drive the UI with zero frontend
 * changes: plain text, key-value facts, tables, and callouts.
 */

export function TextWidget({ payload }: WidgetProps) {
  const data = payload as Record<string, unknown>;
  const title = asStr(data?.title, "Note");
  const text = asStr(data?.text) || asStr(data?.content);
  return (
    <AIBlockCard title={title}>
      <span style={{ whiteSpace: "pre-wrap", lineHeight: "var(--leading-normal)" }}>{text}</span>
    </AIBlockCard>
  );
}

export function KeyValueWidget({ payload }: WidgetProps) {
  const data = payload as Record<string, unknown>;
  const items = asObjArray(data?.items);
  return (
    <AIBlockCard title={asStr(data?.title, "Details")}>
      <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "6px 16px" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "contents" }}>
            <Overline>{asStr(item.label)}</Overline>
            <span style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)" }}>
              {asStr(item.value)}
            </span>
          </div>
        ))}
      </div>
    </AIBlockCard>
  );
}

export function TableWidget({ payload }: WidgetProps) {
  const data = payload as Record<string, unknown>;
  const columns = asObjArray(data?.columns).map((c) => ({
    key: asStr(c.key),
    label: asStr(c.label, asStr(c.key)),
  }));
  const rows = asObjArray(data?.rows);
  return (
    <Card title={asStr(data?.title, "Table")} ai>
      <Table columns={columns} rows={rows} dense />
    </Card>
  );
}

export function AlertWidget({ payload }: WidgetProps) {
  const data = payload as Record<string, unknown>;
  const tone = ["info", "success", "warning", "critical", "ai"].includes(asStr(data?.tone))
    ? (asStr(data?.tone) as "info" | "success" | "warning" | "critical" | "ai")
    : "info";
  const lines = asStrArray(data?.items);
  return (
    <Alert tone={tone} title={asStr(data?.title)}>
      {asStr(data?.body) || lines.join(" · ")}
    </Alert>
  );
}
