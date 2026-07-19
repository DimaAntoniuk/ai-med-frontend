import { useState } from "react";
import { ApiRequestError, api } from "../api/client";
import { Card } from "../design/data/Card";
import { Alert } from "../design/feedback/Alert";
import { Button } from "../design/forms/Button";
import { Input } from "../design/forms/Input";

/**
 * Passwordless sign-in: email → one-time code → HTTP-only session cookie.
 * Without SMTP configured the backend logs the code in the api process log.
 */
export function SignInScreen({ onSignedIn }: { onSignedIn: () => void }) {
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
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.detail : "Could not reach the sign-in service.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.verifyOtp(email.trim(), code.trim());
      onSignedIn();
    } catch (e) {
      setError(
        e instanceof ApiRequestError && e.status === 401
          ? "That code is invalid or has expired — request a new one."
          : "Could not verify the code — try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "48px auto 0", display: "flex", flexDirection: "column", gap: 14 }}>
      <Card title="Sign in to MedAI">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <Alert tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          {step === "email" ? (
            <>
              <Input
                label="Work email"
                type="email"
                placeholder="you@clinic.example"
                value={email}
                autoFocus
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" && email.trim()) requestCode();
                }}
                hint="You will receive a one-time sign-in code."
              />
              <div>
                <Button onClick={requestCode} disabled={busy || !email.trim()}>
                  {busy ? "Sending code…" : "Email me a code"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                label="One-time code"
                mono
                placeholder="000000"
                value={code}
                autoFocus
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" && code.trim()) verify();
                }}
                hint={`Sent to ${email.trim()}. The code expires in 5 minutes.`}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={verify} disabled={busy || !code.trim()}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => { setStep("email"); setCode(""); }}>
                  Use a different email
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textAlign: "center" }}>
        Access is limited to authorized clinicians. Sign-ins are logged for oversight.
      </span>
    </div>
  );
}
