/** Money and date rendering for the team/billing screens, driven by the UI locale. */
import type { Locale } from "../i18n";
import type { MessageKey } from "../i18n/strings";

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

/** Stripe counts trials in days; a plan's period is a month. */
const DAYS_IN_MONTH = 30;

/**
 * A free period as a count plus the key that names its unit — "2" and
 * `billing.trial.month.few`, which the caller renders as *2 місяці*.
 *
 * Whole months are said in months, because two months free is the offer and
 * "60 days free" is the same offer said worse; anything else stays in days
 * rather than rounding what was promised. The plural category rides on the key
 * because Ukrainian has three of them (1 місяць, 2 місяці, 5 місяців), so one
 * "{count} months" string would be wrong more often than right.
 */
export function freePeriod(days: number, locale: Locale): { key: MessageKey; count: number } {
  const months = days > 0 && days % DAYS_IN_MONTH === 0 ? days / DAYS_IN_MONTH : 0;
  const unit = months > 0 ? "month" : "day";
  const count = months > 0 ? months : days;
  const plural = new Intl.PluralRules(intlLocale(locale)).select(count);
  return { key: `billing.trial.${unit}.${plural}` as MessageKey, count };
}
