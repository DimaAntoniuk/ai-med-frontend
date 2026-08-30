/** Money and date rendering for the team/billing screens, driven by the UI locale. */
import type { Locale } from "../i18n";

/** The app's locale codes are language-only; Intl wants the regional variant. */
function intlLocale(locale: Locale): string {
  return locale === "uk" ? "uk-UA" : "en-GB";
}

/** Amounts arrive in minor units; plan prices are whole hryvnias, so no decimals. */
export function formatMoney(minor: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Billing period as "14 Aug – 14 Sep 2026"; the year rides on the end date. */
export function formatPeriod(startIso: string, endIso: string, locale: Locale): string {
  const start = new Date(startIso).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
  });
  return `${start} – ${formatDate(endIso, locale)}`;
}
