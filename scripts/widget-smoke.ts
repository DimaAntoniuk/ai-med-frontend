/**
 * SSR smoke test: renders every registered widget with a realistic payload,
 * a malformed payload, and an empty payload. Run: npx tsx scripts/widget-smoke.ts
 */
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { WidgetView } from "../src/widgets";

const realistic: Record<string, unknown> = {
  differential: {
    differentials: [
      {
        name: "Migraine without aura",
        icd10: "G43.0",
        diagnostic_confidence: 82,
        diagnostic_rationale: "Recurrent unilateral pulsating headache with photophobia and nausea.",
        evidence_confidence: 74,
        evidence_rationale: "Presentation matches ICHD-3 criteria retrieved from the KB.",
        sources: ["criteria:migraine:G43.0", "guideline:headache:red-flags"],
      },
      {
        name: "Tension-type headache",
        icd10: "G44.2",
        diagnostic_confidence: 35,
        diagnostic_rationale: "Less likely given pulsating quality and photophobia.",
        evidence_confidence: 41,
        evidence_rationale: "Partial overlap only.",
        sources: ["criteria:tth:G44.2"],
      },
    ],
  },
  gap_analysis: {
    red_flags: ["No neurological exam documented"],
    missing_questions: ["Aura symptoms before onset?", "Medication overuse frequency?"],
    recommended_tests: ["Neurological examination", "Blood pressure"],
    sources: ["guideline:headache:red-flags"],
  },
  treatment: {
    plan_type: "preliminary",
    steps: ["NSAID at onset", "Hydration and rest", "Headache diary for 4 weeks"],
    rationale: "Symptomatic management pending neurological examination.",
    sources: ["guideline:migraine:acute"],
  },
  text: { title: "Note", text: "Plain narrative block." },
  key_value: { title: "Facts", items: [{ label: "eGFR", value: "52 mL/min" }] },
  table: {
    title: "Labs",
    columns: [{ key: "name", label: "Test" }, { key: "value", label: "Value" }],
    rows: [{ id: 1, name: "K+", value: "5.6 mmol/L" }],
  },
  alert: { tone: "warning", title: "Heads up", body: "Recheck potassium in 10 days." },
};

const cases: Array<[string, string, unknown]> = [];
for (const [kind, payload] of Object.entries(realistic)) {
  cases.push([kind, "realistic", payload]);
  cases.push([kind, "malformed", { unexpected: true, differentials: "not-an-array", steps: 42 }]);
  cases.push([kind, "empty", {}]);
}
cases.push(["unknown_kind", "fallback", { anything: [1, 2, 3] }]);

let failures = 0;
for (const [kind, label, payload] of cases) {
  try {
    const html = renderToString(
      createElement(WidgetView, { descriptor: { type: kind, payload, id: `${kind}-${label}` } }),
    );
    if (!html) throw new Error("empty render");
    console.log(`ok   ${kind} (${label})`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${kind} (${label}):`, error);
  }
}
if (failures > 0) process.exit(1);
console.log(`\nAll ${cases.length} widget renders passed.`);
