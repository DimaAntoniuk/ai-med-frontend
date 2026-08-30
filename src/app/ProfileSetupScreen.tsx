import { useState } from "react";
import { CLINICAL_ROLES, type ClinicalRole, type DoctorProfile } from "../api/profile";
import { Card } from "../design/data/Card";
import { Button } from "../design/forms/Button";
import { Input } from "../design/forms/Input";
import { Select } from "../design/forms/Select";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/strings";

const ROLE_LABEL: Record<ClinicalRole, MessageKey> = {
  physician: "profile.role.physician",
  resident: "profile.role.resident",
  nurse: "profile.role.nurse",
  assistant: "profile.role.assistant",
  other: "profile.role.other",
};

/**
 * The last step of joining: a name to be addressed by and the clinical role the
 * app tailors itself to. Shown once per account, after the first sign-in.
 *
 * It asks for nothing the doctor cannot change later and grants nothing: the
 * role here shapes wording and defaults, while what they may *do* is the team
 * role an owner assigned them, which the API decides on every request.
 */
export function ProfileSetupScreen({
  email,
  onDone,
}: {
  email: string | null;
  onDone: (profile: DoctorProfile) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [role, setRole] = useState<ClinicalRole>("physician");

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed) onDone({ name: trimmed, role });
  };

  return (
    <div style={{ maxWidth: 420, margin: "48px auto 0", display: "flex", flexDirection: "column", gap: 14, padding: "0 16px" }}>
      <span style={{ fontSize: 18, fontWeight: "var(--weight-bold)", letterSpacing: "-0.02em", textAlign: "center" }}>
        Med<span style={{ color: "var(--ai)" }}>AI</span>
      </span>
      <Card title={t("profile.setup.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {t("profile.setup.body", { email: email ?? "" })}
          </span>

          <Input
            label={t("profile.setup.name")}
            placeholder={t("profile.setup.namePlaceholder")}
            value={name}
            autoFocus
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" && name.trim()) submit();
            }}
            hint={t("profile.setup.nameHint")}
          />

          <Select
            label={t("profile.setup.role")}
            value={role}
            options={CLINICAL_ROLES.map((id) => ({ value: id, label: t(ROLE_LABEL[id]) }))}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setRole(e.target.value as ClinicalRole)
            }
            hint={t("profile.setup.roleHint")}
          />

          <div>
            <Button onClick={submit} disabled={!name.trim()}>
              {t("profile.setup.submit")}
            </Button>
          </div>
        </div>
      </Card>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textAlign: "center" }}>
        {t("profile.setup.notice")}
      </span>
    </div>
  );
}

export { ROLE_LABEL };
