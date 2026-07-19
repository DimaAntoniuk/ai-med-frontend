import { useEffect, useState } from "react";
import { UNAUTHORIZED_EVENT, api } from "./api/client";
import { Badge } from "./design/data/Badge";
import { Button } from "./design/forms/Button";
import { ConsultationScreen } from "./app/ConsultationScreen";
import { SignInScreen } from "./app/SignInScreen";

type AuthState = "unknown" | "anonymous" | "authenticated";

export function App() {
  const [auth, setAuth] = useState<AuthState>("unknown");

  useEffect(() => {
    api.probeAuth().then((ok) => setAuth(ok ? "authenticated" : "anonymous"));
    const onUnauthorized = () => setAuth("anonymous");
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const signOut = async () => {
    try {
      await api.logout();
    } finally {
      setAuth("anonymous");
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-page)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 24px",
          height: 56,
          background: "var(--surface-card)",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: "var(--weight-bold)", letterSpacing: "-0.02em" }}>
          Med<span style={{ color: "var(--ai)" }}>AI</span>
        </span>
        <Badge tone="ai">Clinical co-pilot — POC</Badge>
        <span style={{ flex: 1 }} />
        {auth === "authenticated" && (
          <>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
              Doctor review session
            </span>
            <Button size="sm" variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </>
        )}
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 860, margin: "0 auto", padding: "18px 24px 8px" }}>
        {auth === "authenticated" && <ConsultationScreen />}
        {auth === "anonymous" && <SignInScreen onSignedIn={() => setAuth("authenticated")} />}
        {auth === "unknown" && (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            Connecting to the MedAI service…
          </span>
        )}
      </main>

      <footer
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--text-tertiary)",
          textAlign: "center",
          padding: "14px 24px 18px",
        }}
      >
        AI-generated content — verify before clinical use. Runs are logged for oversight (EU AI Act, Art. 13/14).
        Identifying details are redacted locally before any text reaches the model.
      </footer>
    </div>
  );
}
