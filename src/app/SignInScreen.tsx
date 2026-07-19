import { useState } from "react";
import { ApiRequestError, api } from "../api/client";
import { Card } from "../design/data/Card";
import { Alert } from "../design/feedback/Alert";
import { Button } from "../design/forms/Button";
import { Input } from "../design/forms/Input";
import { useT } from "../i18n";

/**
 * Passwordless sign-in: email → one-time code → HTTP-only session cookie.
 * Without SMTP configured the backend logs the code in the api process log.
 */
export function SignInScreen({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const t = useT();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                <Button onClick={requestCode} disabled={busy || !email.trim()}>
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
                <Button onClick={verify} disabled={busy || !code.trim()}>
                  {busy ? t("signin.submitting") : t("signin.submit")}
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => { setStep("email"); setCode(""); }}>
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
