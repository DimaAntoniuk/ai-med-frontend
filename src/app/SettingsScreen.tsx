import { Card } from "../design/data/Card";
import { Select } from "../design/forms/Select";
import { useSettings, type Locale, type ThemeSetting } from "../i18n";

/** Theme + language, persisted in this browser (see docs: BE persistence requested). */
export function SettingsScreen() {
  const { locale, setLocale, theme, setTheme, t } = useSettings();
  return (
    <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 14 }}>
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
