import { useEffect, useState } from "react";
import { ApiRequestError, api, apiUrl, type AuthMethods } from "../api/client";
import { Card } from "../design/data/Card";
import { Alert } from "../design/feedback/Alert";
import { Button } from "../design/forms/Button";
import { Input } from "../design/forms/Input";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/strings";

/**
 * Sign-in: WorkOS single sign-on where the deployment has it, email one-time
 * code everywhere. Both end in the same HTTP-only `session` cookie, which is
 * why neither branch hands the app a token to keep.
 *
 * Without SMTP configured the backend logs the code in the api process log.
 */

/**
 * How WorkOS's round-trip reports itself. The callback always lands the browser
 * back on the app — successfully, or carrying `?login_error=`. There is no
 * success parameter: a clean URL plus a live session is the success signal.
 */
const LOGIN_ERROR: Record<string, MessageKey> = {
  state_mismatch: "signin.error.stateMismatch",
  not_permitted: "signin.error.notPermitted",
  provider_unavailable: "signin.error.providerUnavailable",
};

export function SignInScreen({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const t = useT();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [methods, setMethods] = useState<AuthMethods | null>(null);
  /** Set while the browser is on its way to WorkOS — the form stays disabled. */
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // A failed SSO round-trip arrives as a query parameter. Read it once and
    // strip it, or a refresh re-raises an error the doctor already dismissed.
    const reason = new URLSearchParams(window.location.search).get("login_error");
    if (reason) {
      setError(t(LOGIN_ERROR[reason] ?? "signin.error.providerUnavailable"));
      const url = new URL(window.location.href);
      url.searchParams.delete("login_error");
      window.history.replaceState({}, "", url.toString());
    }
    // A backend that cannot answer this still signs doctors in by code, so the
    // OTP form is never gated on it — only the SSO button is.
    api.authMethods().then(setMethods).catch(() => setMethods(null));
  }, [t]);

  const startSso = () => {
    setLeaving(true);
    // A navigation, not a fetch: the response redirects to workos.com, which no
    // CORS policy permits, and the short-lived state cookie would ride on an
    // XHR the browser then throws away. It must also not be an iframe.
    window.location.assign(apiUrl("/auth/sso/start"));
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.requestOtp(email.trim());
      setStep("code");
    } catch {
      setError(t("signin.unreachable"));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.verifyOtp(email.trim(), code.trim());
      onSignedIn(email.trim());
    } catch (e) {
      setError(
        e instanceof ApiRequestError && e.status === 401
          ? t("signin.invalidCode")
          : t("signin.verifyFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || leaving;

  return (
    <div style={{ maxWidth: 420, margin: "48px auto 0", display: "flex", flexDirection: "column", gap: 14, padding: "0 16px" }}>
      <span style={{ fontSize: 18, fontWeight: "var(--weight-bold)", letterSpacing: "-0.02em", textAlign: "center" }}>
        Med<span style={{ color: "var(--ai)" }}>AI</span>
      </span>
      <Card title={t("signin.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <Alert tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Said before the doctor types: an address outside the allowed
              domains gets the same 202 and no code, which otherwise reads as a
              lost email. The flag says a restriction exists, not what it is. */}
          {methods?.restricted && <Alert tone="info">{t("signin.restricted")}</Alert>}

          {methods?.sso && step === "email" && (
            <>
              <Button onClick={startSso} disabled={disabled}>
                {leaving ? t("signin.ssoLeaving") : t("signin.sso")}
              </Button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                  {t("signin.or")}
                </span>
                <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              </div>
            </>
          )}

          {step === "email" ? (
            <>
              <Input
                label={t("signin.email")}
                type="email"
                placeholder="you@clinic.example"
                value={email}
                autoFocus
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" && email.trim()) requestCode();
                }}
                hint={t("signin.emailHint")}
              />
              <div>
                <Button
                  variant={methods?.sso ? "secondary" : "primary"}
                  onClick={requestCode}
                  disabled={disabled || !email.trim()}
                >
                  {busy ? t("signin.requestingCode") : t("signin.requestCode")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                label={t("signin.code")}
                mono
                placeholder="000000"
                value={code}
                autoFocus
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" && code.trim()) verify();
                }}
                hint={t("signin.codeHint", { email: email.trim() })}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={verify} disabled={disabled || !code.trim()}>
                  {busy ? t("signin.submitting") : t("signin.submit")}
                </Button>
                <Button variant="ghost" disabled={disabled} onClick={() => { setStep("email"); setCode(""); }}>
                  {t("signin.changeEmail")}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textAlign: "center" }}>
        {t("signin.notice")}
      </span>
    </div>
  );
}
