import { useEffect, useState } from "react";
import { UNAUTHORIZED_EVENT, api } from "./api/client";
import { Badge } from "./design/data/Badge";
import { Button } from "./design/forms/Button";
import { ConsultationScreen } from "./app/ConsultationScreen";
import { SettingsScreen } from "./app/SettingsScreen";
import { SignInScreen } from "./app/SignInScreen";
import { useT } from "./i18n";

type AuthState = "unknown" | "anonymous" | "authenticated";
type View = "consultation" | "settings";

const PROFILE_KEY = "medai-profile-email";

function initialsOf(email: string | null): string {
  if (!email) return "MD";
  const parts = email.split("@")[0].split(/[._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0].toUpperCase());
  return letters.join("") || "MD";
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        padding: "9px 12px",
        borderRadius: "var(--r-md)",
        background: active ? "var(--primary-tint)" : "transparent",
        color: active ? "var(--primary)" : "var(--text-secondary)",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-base)",
        fontWeight: active ? "var(--weight-semibold)" : "var(--weight-regular)",
        transition: "background 120ms ease",
      }}
    >
      {label}
    </button>
  );
}

export function App() {
  const t = useT();
  const [auth, setAuth] = useState<AuthState>("unknown");
  const [view, setView] = useState<View>("consultation");
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(PROFILE_KEY));

  useEffect(() => {
    api.probeAuth().then((ok) => setAuth(ok ? "authenticated" : "anonymous"));
    const onUnauthorized = () => setAuth("anonymous");
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const signedIn = (address: string) => {
    if (address) {
      localStorage.setItem(PROFILE_KEY, address);
      setEmail(address);
    }
    setAuth("authenticated");
  };

  const signOut = async () => {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem(PROFILE_KEY);
      setEmail(null);
      setAuth("anonymous");
    }
  };

  if (auth !== "authenticated") {
    return (
      <div style={{ minHeight: "100%", background: "var(--surface-page)", fontFamily: "var(--font-ui)" }}>
        {auth === "anonymous" ? (
          <SignInScreen onSignedIn={signedIn} />
        ) : (
          <div style={{ padding: 48, fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {t("app.connecting")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        background: "var(--surface-page)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* Left navigation: wordmark, views, signed-in profile */}
      <aside
        style={{
          width: 248,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "18px 14px 14px",
          background: "var(--surface-card)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: "var(--weight-bold)", letterSpacing: "-0.02em", padding: "0 12px" }}>
          Med<span style={{ color: "var(--ai)" }}>AI</span>
        </span>
        <span style={{ padding: "4px 12px 12px" }}>
          <Badge tone="ai">{t("app.badge")}</Badge>
        </span>

        <NavItem
          label={t("nav.consultation")}
          active={view === "consultation"}
          onClick={() => setView("consultation")}
        />
        <NavItem
          label={t("nav.settings")}
          active={view === "settings"}
          onClick={() => setView("settings")}
        />

        <span style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              flexShrink: 0,
              background: "var(--primary-tint)",
              color: "var(--primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "var(--weight-bold)",
              fontSize: "var(--text-sm)",
            }}
          >
            {initialsOf(email)}
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={email ?? undefined}
            >
              {email ?? t("profile.local")}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
              {t("profile.role")}
            </span>
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={signOut}>
          {t("app.signOut")}
        </Button>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <main style={{ flex: 1, width: "100%", maxWidth: 860, margin: "0 auto", padding: "18px 24px 8px" }}>
          {view === "consultation" ? <ConsultationScreen /> : <SettingsScreen />}
        </main>
        <footer
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            textAlign: "center",
            padding: "14px 24px 18px",
          }}
        >
          {t("app.footer")}
        </footer>
      </div>
    </div>
  );
}
