import { useEffect, useState } from "react";
import { PAYMENT_REQUIRED_EVENT, UNAUTHORIZED_EVENT, api } from "./api/client";
import {
  initialsOf,
  loadProfile,
  saveProfile,
  type DoctorProfile,
} from "./api/profile";
import { Alert } from "./design/feedback/Alert";
import { Badge } from "./design/data/Badge";
import { Button } from "./design/forms/Button";
import { BillingScreen } from "./app/BillingScreen";
import {
  ConsultationScreen,
  clearTranscriptSession,
  openTranscriptSession,
} from "./app/ConsultationScreen";
import { HistoryNav } from "./app/HistoryNav";
import { ProfileSetupScreen, ROLE_LABEL } from "./app/ProfileSetupScreen";
import { SettingsScreen } from "./app/SettingsScreen";
import { SignInScreen } from "./app/SignInScreen";
import { TeamScreen } from "./app/TeamScreen";
import { useT } from "./i18n";
import { en, type MessageKey } from "./i18n/strings";

type AuthState = "unknown" | "anonymous" | "authenticated";
type View = "consultation" | "team" | "billing" | "settings";

const PROFILE_KEY = "medai-profile-email";

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
  // Name and clinical role, keyed to the account. Null means this doctor has
  // not finished joining yet — the setup step stands between them and the app.
  const [profile, setProfile] = useState<DoctorProfile | null>(() =>
    loadProfile(localStorage.getItem(PROFILE_KEY)),
  );
  // Remount key for ConsultationScreen — it rehydrates from the stored session
  // on mount, so bumping this after a session change swaps the open transcript.
  const [consultKey, setConsultKey] = useState(0);
  // Set when the team screen sends the reader to billing to buy seats, so the
  // billing screen opens on the plan dialog instead of making them hunt for it.
  const [billingSeatFocus, setBillingSeatFocus] = useState(false);
  // Set when a clinical route answers 402: the session is fine, the surface is
  // not paid for. Holds the key the backend sent so the reason is the real one.
  const [paywall, setPaywall] = useState<MessageKey | null>(null);

  const openView = (next: View) => {
    setBillingSeatFocus(false);
    setView(next);
  };

  const openSeatPurchase = () => {
    setBillingSeatFocus(true);
    setView("billing");
  };

  const newConsultation = () => {
    clearTranscriptSession();
    setConsultKey((k) => k + 1);
    openView("consultation");
  };

  const openFromHistory = (id: string) => {
    openTranscriptSession(id);
    setConsultKey((k) => k + 1);
    openView("consultation");
  };

  useEffect(() => {
    api.probeAuth().then((ok) => setAuth(ok ? "authenticated" : "anonymous"));
    const onUnauthorized = () => setAuth("anonymous");
    // 402 is not 401: the session is untouched, the reader is sent to billing.
    const onPaymentRequired = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setPaywall(
        typeof detail === "string" && detail in en
          ? (detail as MessageKey)
          : "billing.error.required",
      );
      setView("billing");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    window.addEventListener(PAYMENT_REQUIRED_EVENT, onPaymentRequired);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
      window.removeEventListener(PAYMENT_REQUIRED_EVENT, onPaymentRequired);
    };
  }, []);

  const signedIn = (address: string) => {
    if (address) {
      localStorage.setItem(PROFILE_KEY, address);
      setEmail(address);
      // A doctor who has signed in here before keeps their name and role; a new
      // one falls through to the setup step below.
      setProfile(loadProfile(address));
    }
    setAuth("authenticated");
  };

  const profileDone = (next: DoctorProfile) => {
    saveProfile(email, next);
    setProfile(next);
  };

  const signOut = async () => {
    let signOutUrl = "";
    try {
      signOutUrl = (await api.logout()).sign_out_url;
    } finally {
      localStorage.removeItem(PROFILE_KEY);
      setEmail(null);
      // The stored profile stays: it is keyed to the account, so signing back
      // in restores it, and another doctor's account never reads it.
      setProfile(null);
      setAuth("anonymous");
    }
    // Set only while the identity provider still holds a session of its own.
    // Ending it is what stops the next doctor at this workstation being signed
    // straight back in as the last one; WorkOS returns the browser to the app.
    if (signOutUrl) window.location.assign(signOutUrl);
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

  // Registration finishes here, not at the code prompt. Skipped when there is
  // no account to key a profile to — the gate is disarmed, or SSO landed the
  // browser back without the app learning an address.
  if (email && !profile) {
    return (
      <div style={{ minHeight: "100%", background: "var(--surface-page)", fontFamily: "var(--font-ui)" }}>
        <ProfileSetupScreen email={email} onDone={profileDone} />
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

        <Button
          variant="secondary"
          size="sm"
          onClick={newConsultation}
          style={{ justifyContent: "flex-start", margin: "0 0 8px" }}
          icon={<span aria-hidden="true">+</span>}
        >
          {t("nav.newConsultation")}
        </Button>

        <NavItem
          label={t("nav.consultation")}
          active={view === "consultation"}
          onClick={() => openView("consultation")}
        />
        <NavItem label={t("nav.team")} active={view === "team"} onClick={() => openView("team")} />
        <NavItem
          label={t("nav.billing")}
          active={view === "billing"}
          onClick={() => openView("billing")}
        />
        <NavItem
          label={t("nav.settings")}
          active={view === "settings"}
          onClick={() => openView("settings")}
        />

        {/* History: horizontally separated section, vertical scroll */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--border-subtle)",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-semibold)",
              letterSpacing: "var(--tracking-caps)",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              padding: "0 12px 2px",
            }}
          >
            {t("nav.history")}
          </span>
          <HistoryNav onOpen={openFromHistory} />
        </div>

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
            {initialsOf(profile, email)}
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
              {profile?.name ?? email ?? t("profile.local")}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
              {profile ? t(ROLE_LABEL[profile.role]) : t("profile.role")}
            </span>
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={signOut}>
          {t("app.signOut")}
        </Button>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* Team and billing carry wide tables — they get more room than the reading column. */}
        <main
          style={{
            flex: 1,
            width: "100%",
            maxWidth: view === "team" || view === "billing" ? 1000 : 860,
            margin: "0 auto",
            padding: "18px 24px 8px",
          }}
        >
          {view === "consultation" && <ConsultationScreen key={consultKey} />}
          {view === "team" && (
            <TeamScreen currentEmail={email} onManageSeats={openSeatPurchase} />
          )}
          {view === "billing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {paywall && (
                <Alert
                  tone="warning"
                  title={t("billing.paywall.title")}
                  onDismiss={() => setPaywall(null)}
                >
                  {t(paywall)}
                </Alert>
              )}
              <BillingScreen openPlanOnMount={billingSeatFocus} />
            </div>
          )}
          {view === "settings" && (
            <SettingsScreen profile={profile} onProfileChange={profileDone} />
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
          {t("app.footer")}
        </footer>
      </div>
    </div>
  );
}
