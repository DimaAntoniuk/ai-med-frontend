import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { SettingsProvider, applyTheme } from "./i18n";
import "./styles.css";

// Resolve the theme before first paint to avoid a light flash in dark mode.
try {
  const stored = JSON.parse(localStorage.getItem("medai-settings") ?? "{}");
  applyTheme(stored.theme ?? "system");
} catch {
  applyTheme("system");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>,
);
