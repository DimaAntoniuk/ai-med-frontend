import { useState } from "react";
import { CLINICAL_ROLES, type ClinicalRole, type DoctorProfile } from "../api/profile";
import { Card } from "../design/data/Card";
import { Button } from "../design/forms/Button";
import { Input } from "../design/forms/Input";
import { Select } from "../design/forms/Select";
import { useSettings, type Locale, type ThemeSetting } from "../i18n";
import { ROLE_LABEL } from "./ProfileSetupScreen";

/** Theme + language, persisted in this browser (see docs: BE persistence requested). */
export function SettingsScreen({
  profile,
  onProfileChange,
}: {
  profile: DoctorProfile | null;
  onProfileChange: (profile: DoctorProfile) => void;
}) {
  const { locale, setLocale, theme, setTheme, t } = useSettings();
  const [name, setName] = useState(profile?.name ?? "");
  const [role, setRole] = useState<ClinicalRole>(profile?.role ?? "physician");
  const [saved, setSaved] = useState(false);

  const dirty = profile !== null && (name.trim() !== profile.name || role !== profile.role);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onProfileChange({ name: trimmed, role });
    setSaved(true);
  };

  return (
    <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Only where there is an account to key it to — see api/profile.ts. */}
      {profile && (
        <Card title={t("settings.profile")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label={t("profile.setup.name")}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
            <Select
              label={t("profile.setup.role")}
              value={role}
              options={CLINICAL_ROLES.map((id) => ({ value: id, label: t(ROLE_LABEL[id]) }))}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setRole(e.target.value as ClinicalRole);
                setSaved(false);
              }}
              hint={t("profile.setup.roleHint")}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Button onClick={save} disabled={!dirty || !name.trim()}>
                {t("settings.profile.save")}
              </Button>
              {saved && (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
                  {t("settings.profile.saved")}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card title={t("settings.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select
            label={t("settings.theme")}
            value={theme}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setTheme(e.target.value as ThemeSetting)
            }
            options={[
              { value: "system", label: t("settings.theme.system") },
              { value: "light", label: t("settings.theme.light") },
              { value: "dark", label: t("settings.theme.dark") },
            ]}
          />
          <Select
            label={t("settings.language")}
            value={locale}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setLocale(e.target.value as Locale)
            }
            options={[
              { value: "uk", label: t("settings.language.uk") },
              { value: "en", label: t("settings.language.en") },
            ]}
          />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {t("settings.note")}
          </span>
        </div>
      </Card>
    </div>
  );
}
