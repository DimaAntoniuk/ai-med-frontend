import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, uk, type MessageKey } from "./strings";

export type Locale = "en" | "uk";
export type ThemeSetting = "system" | "light" | "dark";

const STORAGE_KEY = "medai-settings";

interface StoredSettings {
  locale?: Locale;
  theme?: ThemeSetting;
}

function loadStored(): StoredSettings {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function defaultLocale(): Locale {
  return navigator.language?.toLowerCase().startsWith("uk") ? "uk" : "en";
}

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, uk };

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

function makeT(locale: Locale): Translate {
  return (key, params) => {
    let text: string = dictionaries[locale][key] ?? en[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

interface SettingsContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: ThemeSetting;
  setTheme: (t: ThemeSetting) => void;
  t: Translate;
}

/* Default value keeps components renderable outside the provider (SSR smoke tests). */
const SettingsContext = createContext<SettingsContextValue>({
  locale: "en",
  setLocale: () => {},
  theme: "system",
  setTheme: () => {},
  t: makeT("en"),
});

/** Resolve a theme setting to the concrete data-theme attribute on <html>. */
export function applyTheme(setting: ThemeSetting) {
  const effective =
    setting === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : setting;
  document.documentElement.dataset.theme = effective;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const stored = loadStored();
  const [locale, setLocaleState] = useState<Locale>(stored.locale ?? defaultLocale());
  const [theme, setThemeState] = useState<ThemeSetting>(stored.theme ?? "system");

  const persist = useCallback((next: StoredSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadStored(), ...next }));
  }, []);

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      persist({ locale: l });
    },
    [persist],
  );

  const setTheme = useCallback(
    (t: ThemeSetting) => {
      setThemeState(t);
      persist({ theme: t });
    },
    [persist],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo<SettingsContextValue>(
    () => ({ locale, setLocale, theme, setTheme, t: makeT(locale) }),
    [locale, setLocale, theme, setTheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}

export function useT(): Translate {
  return useContext(SettingsContext).t;
}
