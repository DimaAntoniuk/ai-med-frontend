// Register a classic-runtime react preset for inline text/babel scripts
if (window.Babel) {
  Babel.registerPreset("react-classic", {
    presets: [[Babel.availablePresets["react"], { runtime: "classic" }]],
  });
}
// Card/kit loader: prefer the generated _ds_bundle.js namespace; fall back to
// transpiling the component sources directly so specimens render standalone.
window.loadDS = async function (base) {
  if (window.__DS) return window.__DS;
  try {
    const r = await fetch(base + "_ds_bundle.js");
    if (r.ok) {
      new Function(await r.text())();
      const ns = Object.values(window).find(
        (v) => v && typeof v === "object" && v.Button && v.AIMessage && v.PatientHeader
      );
      if (ns) return (window.__DS = ns);
    }
  } catch (e) { /* fall through */ }
  const files = [
    "forms/Button.jsx", "forms/IconButton.jsx", "forms/Input.jsx", "forms/Select.jsx",
    "forms/Checkbox.jsx", "forms/Switch.jsx", "forms/Textarea.jsx",
    "data/Card.jsx", "data/Table.jsx", "data/Tabs.jsx", "data/Badge.jsx",
    "feedback/Alert.jsx", "feedback/Dialog.jsx", "feedback/Toast.jsx",
    "healthcare/AcuityPill.jsx", "healthcare/PatientHeader.jsx", "healthcare/VitalCard.jsx", "healthcare/PatientListItem.jsx",
    "ai/AIBadge.jsx", "ai/ConfidenceMeter.jsx", "ai/CitationChip.jsx", "ai/ReviewBar.jsx", "ai/AIMessage.jsx", "ai/AuditLogEntry.jsx",
  ];
  const texts = await Promise.all(files.map((f) => fetch(base + "components/" + f).then((r) => r.text())));
  const allNames = ["Button", "IconButton", "Field", "Input", "Select", "Checkbox", "RadioGroup", "Switch", "Textarea",
    "Card", "Table", "Tabs", "Badge", "Tag", "Alert", "Dialog", "Toast", "Tooltip",
    "AcuityPill", "PatientHeader", "VitalCard", "PatientListItem",
    "AIBadge", "ConfidenceMeter", "CitationChip", "SourceRow", "ReviewBar", "AuditLogEntry"];
  const ns = {};
  for (const text of texts) {
    const exportsHere = [...text.matchAll(/^export function (\w+)/gm)].map((m) => m[1]);
    const src = text.replace(/^import .*$/gm, "").replace(/^export /gm, "");
    const code = Babel.transform(src, { presets: [["react", { runtime: "classic" }]] }).code;
    const deps = allNames.filter((n) => !exportsHere.includes(n));
    const make = new Function("React", "__deps",
      "const {useState,useEffect,useRef} = React;\nconst {" + deps.join(",") + "} = __deps;\n" +
      code + "\nreturn {" + exportsHere.join(",") + "};");
    Object.assign(ns, make(window.React, ns));
  }
  return (window.__DS = ns);
};

// Load a UI-kit screen .jsx (strips imports; deps come from the design-system namespace)
window.loadJSX = async function (url, deps) {
  const text = await (await fetch(url)).text();
  const exportsHere = [...text.matchAll(/^export function (\w+)/gm)].map((m) => m[1]);
  const src = text.replace(/^import .*$/gm, "").replace(/^export /gm, "");
  const code = Babel.transform(src, { presets: [["react", { runtime: "classic" }]] }).code;
  const make = new Function("React", "__deps",
    "const {useState,useEffect,useRef} = React;\nconst {" + Object.keys(deps).join(",") + "} = __deps;\n" +
    code + "\nreturn {" + exportsHere.join(",") + "};");
  return make(window.React, deps);
};
