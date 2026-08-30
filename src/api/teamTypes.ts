/**
 * Wire types for the team/billing surface, shared by the live client
 * (`./team`) and the offline stand-in (`./teamFixtures`).
 *
 * These are field-for-field what the backend serves — see
 * `ai-med-agent/docs/fe-billing.md`.
 */
import type { MessageKey } from "../i18n/strings";

export type PlanId = "solo" | "team" | "clinic";
export type BillingCycle = "monthly" | "annual";
export type MemberRole = "owner" | "admin" | "clinician";
export type MemberStatus = "active" | "invited" | "suspended";
export type SubscriptionStatus = "active" | "past_due" | "canceled";
export type InvoiceStatus = "paid" | "open" | "failed";

/** Catalogue entry. Prices are per seat per month, in minor units (kopiykas). */
export interface PlanDto {
  id: PlanId;
  monthly_minor: number;
  /** Per-month price when the year is paid up front. */
  annual_minor: number;
  min_seats: number;
  max_seats: number;
}

export interface SubscriptionDto {
  plan: PlanId;
  cycle: BillingCycle;
  status: SubscriptionStatus;
  seats_total: number;
  /** Seats held by active members and outstanding invitations. */
  seats_used: number;
  currency: string;
  /** Charge for one whole period — the annual cycle bills twelve months. */
  amount_minor: number;
  renews_at: string;
  /** Cancellation is deferred: access lasts until `renews_at`. */
  cancel_at_period_end: boolean;
  /**
   * Set only while the free period runs, and equal to `renews_at` then: the
   * trial ends into the first charge. `status` still reads `active` and the
   * workspace is fully unlocked — a trial is the product, not a waiting room.
   */
  trial_ends_at: string | null;
}

/** Only the brand and last four digits are ever held frontend-side. */
export interface PaymentMethodDto {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  holder: string;
}

/** Invoice header for a Ukrainian legal entity — `tax_id` is the ЄДРПОУ/ІПН. */
export interface BillingProfileDto {
  company: string;
  tax_id: string;
  email: string;
  address: string;
}

export interface InvoiceDto {
  id: string;
  number: string;
  issued_at: string;
  period_start: string;
  period_end: string;
  seats: number;
  amount_minor: number;
  currency: string;
  status: InvoiceStatus;
}

export interface MemberDto {
  id: string;
  /** Empty until a display name exists anywhere — render the address instead. */
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  /** null while an invitation is outstanding. */
  last_active_at: string | null;
}

/**
 * `GET /billing` — the one billing route that never 404s.
 *
 * `available: false` means this deployment has no billing configured at all:
 * hide the whole team/billing surface. `subscribed` is the only field an app
 * gate should read.
 */
export interface BillingProbeDto {
  available: boolean;
  subscribed: boolean;
  role: MemberRole | "";
  subscription: SubscriptionDto | null;
  /**
   * Free days this doctor's *next* purchase would run — 0 where the deployment
   * sells no trial, and 0 once the workspace has bought anything, so a screen
   * never advertises a free period that is already spent.
   */
  trial_days: number;
}

/**
 * Is there a workspace behind this doctor yet? Someone who has signed in but
 * never bought anything has none, and the probe says so by carrying no
 * subscription. There is no roster to list, no card on file and no invoice
 * history until the first checkout creates them — those routes answer 403
 * until then, so nothing should ask.
 */
export function hasWorkspace(probe: BillingProbeDto): boolean {
  return probe.subscription !== null;
}

/**
 * May this doctor buy, and change what was bought? A doctor signing up alone
 * owns the workspace their first purchase creates — checkout provisions it with
 * them as its owner — so the purchase controls are theirs from the start.
 * Reading a workspace-less probe as "someone else owns this" would leave a solo
 * doctor staring at a locked screen with no way to pay. Backends that answer a
 * blank role there rather than "owner" mean the same thing.
 */
export function ownsBilling(probe: BillingProbeDto): boolean {
  return probe.role === "owner" || (probe.role === "" && !hasWorkspace(probe));
}

/**
 * Is the free period still running? It is not a lesser state — the workspace is
 * unlocked and `status` says `active` — only the answer to "has anything been
 * charged yet", which decides whether "start paying now" has anything to do.
 */
export function isTrialing(subscription: SubscriptionDto | null): boolean {
  return subscription?.trial_ends_at != null;
}

/**
 * Rejection carrying a message key, so screens localize the reason instead of
 * printing a server string. The backend answers `{ "detail": "<key>",
 * "params": {…} }` — `params` carries the interpolations the key needs.
 */
export class TeamApiError extends Error {
  constructor(
    public readonly key: MessageKey,
    public readonly params?: Record<string, string | number>,
    /** HTTP status, so a screen can tell 403 (hide the control) from 409. */
    public readonly status = 0,
  ) {
    super(key);
    this.name = "TeamApiError";
  }
}

/** Per-seat, per-month price for a plan on a cycle. */
export function seatPriceMinor(plan: PlanDto, cycle: BillingCycle): number {
  return cycle === "annual" ? plan.annual_minor : plan.monthly_minor;
}

/**
 * What one period costs: the annual cycle charges twelve months up front.
 *
 * This is a *preview* only — the authoritative `amount_minor` comes back on the
 * `SubscriptionDto` the server returns after the change.
 */
export function periodAmountMinor(plan: PlanDto, cycle: BillingCycle, seats: number): number {
  return seatPriceMinor(plan, cycle) * seats * (cycle === "annual" ? 12 : 1);
}

/** Look a plan up in a server-served catalogue; falls back to the first entry. */
export function planById(plans: readonly PlanDto[], id: PlanId): PlanDto | null {
  return plans.find((p) => p.id === id) ?? null;
}

/** The surface both the live client and the stand-in implement. */
export interface TeamApi {
  probe(): Promise<BillingProbeDto>;
  listPlans(): Promise<PlanDto[]>;
  getSubscription(): Promise<SubscriptionDto | null>;
  changeSubscription(next: {
    plan: PlanId;
    cycle: BillingCycle;
    seats: number;
  }): Promise<SubscriptionDto>;
  setCancelAtPeriodEnd(flag: boolean): Promise<SubscriptionDto>;
  /** Bring the first charge forward to today; the plan and seats do not change. */
  endTrial(): Promise<SubscriptionDto>;
  getPaymentMethod(): Promise<PaymentMethodDto | null>;
  /** Answers a Stripe-hosted URL to navigate to — the card never reaches us. */
  startPaymentMethodUpdate(): Promise<{ url: string }>;
  getBillingProfile(): Promise<BillingProfileDto>;
  updateBillingProfile(next: BillingProfileDto): Promise<BillingProfileDto>;
  listInvoices(): Promise<InvoiceDto[]>;
  listMembers(): Promise<MemberDto[]>;
  inviteMember(email: string, role: MemberRole): Promise<MemberDto>;
  updateMemberRole(id: string, role: MemberRole): Promise<MemberDto>;
  setMemberStatus(id: string, status: "active" | "suspended"): Promise<MemberDto>;
  resendInvite(id: string): Promise<MemberDto>;
  removeMember(id: string): Promise<void>;
}
