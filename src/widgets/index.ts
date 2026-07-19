import { registerWidget } from "./registry";
import { DifferentialWidget, GapAnalysisWidget, TreatmentWidget } from "./clinical";
import { AlertWidget, KeyValueWidget, TableWidget, TextWidget } from "./generic";

/**
 * The widget catalog. Block `kind` strings emitted by the agent's `present`
 * tool select widgets here; anything unregistered falls back to raw JSON.
 */
registerWidget("differential", DifferentialWidget);
registerWidget("gap_analysis", GapAnalysisWidget);
registerWidget("treatment", TreatmentWidget);
registerWidget("text", TextWidget);
registerWidget("key_value", KeyValueWidget);
registerWidget("table", TableWidget);
registerWidget("alert", AlertWidget);

export { WidgetView } from "./registry";
export type { WidgetDescriptor } from "./registry";
