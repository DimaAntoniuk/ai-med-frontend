/**
 * Team subscription: seats, billing and membership.
 *
 * The POC backend has no team or billing routes yet, so this module holds the
 * proposed wire contract next to an in-memory stand-in that answers it. The DTO
 * shapes and the `teamApi` surface are what the backend is asked to ship; when
 * it does, the bodies below become `request()` calls (see ./client) and no
 * screen has to change.
 *
 * Nothing here reaches the network — changes live for the lifetime of the tab.
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
  /** Empty until an invitation is accepted — render the address instead. */
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  /** null while an invitation is outstanding. */
  last_active_at: string | null;
}

/**
 * Rejection carrying a message key, so screens localize the reason instead of
 * printing a server string. The backend is asked to answer the same set as
 * `{ "detail": "<key>" }`.
 */
export class TeamApiError extends Error {
  constructor(
    public readonly key: MessageKey,
    public readonly params?: Record<string, string | number>,
  ) {
    super(key);
    this.name = "TeamApiError";
  }
}

const CURRENCY = "UAH";

const CATALOGUE: PlanDto[] = [
  { id: "solo", monthly_minor: 69000, annual_minor: 57500, min_seats: 1, max_seats: 1 },
  { id: "team", monthly_minor: 59000, annual_minor: 49000, min_seats: 2, max_seats: 25 },
  { id: "clinic", monthly_minor: 49000, annual_minor: 41000, min_seats: 10, max_seats: 200 },
];

export function planById(id: PlanId): PlanDto {
  return CATALOGUE.find((p) => p.id === id) ?? CATALOGUE[1];
}

export function seatPriceMinor(plan: PlanId, cycle: BillingCycle): number {
  const entry = planById(plan);
  return cycle === "annual" ? entry.annual_minor : entry.monthly_minor;
}

/** What one period costs: the annual cycle charges twelve months up front. */
export function periodAmountMinor(plan: PlanId, cycle: BillingCycle, seats: number): number {
  return seatPriceMinor(plan, cycle) * seats * (cycle === "annual" ? 12 : 1);
}

type StoredSubscription = Omit<SubscriptionDto, "seats_used" | "amount_minor">;

let subscription: StoredSubscription = {
  plan: "team",
  cycle: "monthly",
  status: "active",
  seats_total: 6,
  currency: CURRENCY,
  renews_at: "2026-09-14T00:00:00.000Z",
  cancel_at_period_end: false,
};

let members: MemberDto[] = [
  {
    id: "m-1",
    name: "Олена Ковальчук",
    email: "olena.kovalchuk@clinic.example",
    role: "owner",
    status: "active",
    last_active_at: "2026-08-30T07:12:00.000Z",
  },
  {
    id: "m-2",
    name: "Андрій Шевченко",
    email: "andrii.shevchenko@clinic.example",
    role: "admin",
    status: "active",
    last_active_at: "2026-08-29T15:40:00.000Z",
  },
  {
    id: "m-3",
    name: "Марія Бондаренко",
    email: "mariia.bondarenko@clinic.example",
    role: "clinician",
    status: "active",
    last_active_at: "2026-08-28T09:05:00.000Z",
  },
  {
    id: "m-4",
    name: "Ігор Ткаченко",
    email: "ihor.tkachenko@clinic.example",
    role: "clinician",
    status: "active",
    last_active_at: "2026-08-21T11:30:00.000Z",
  },
  {
    id: "m-5",
    name: "",
    email: "nataliia.petrenko@clinic.example",
    role: "clinician",
    status: "invited",
    last_active_at: null,
  },
  {
    id: "m-6",
    name: "Софія Мельник",
    email: "sofiia.melnyk@clinic.example",
    role: "clinician",
    status: "suspended",
    last_active_at: "2026-06-02T08:20:00.000Z",
  },
];

let payment: PaymentMethodDto | null = {
  brand: "visa",
  last4: "4242",
  exp_month: 4,
  exp_year: 2029,
  holder: "OLENA KOVALCHUK",
};

let profile: BillingProfileDto = {
  company: 'ТОВ "Медичний центр Асклепій"',
  tax_id: "42731905",
  email: "buh@clinic.example",
  address: "вул. Богдана Хмельницького, 24, Київ, 01030",
};

const invoices: InvoiceDto[] = [
  {
    id: "in-8",
    number: "INV-2026-0008",
    issued_at: "2026-08-14T00:00:00.000Z",
    period_start: "2026-08-14T00:00:00.000Z",
    period_end: "2026-09-14T00:00:00.000Z",
    seats: 6,
    amount_minor: 354000,
    currency: CURRENCY,
    status: "open",
  },
  {
    id: "in-7",
    number: "INV-2026-0007",
    issued_at: "2026-07-14T00:00:00.000Z",
    period_start: "2026-07-14T00:00:00.000Z",
    period_end: "2026-08-14T00:00:00.000Z",
    seats: 6,
    amount_minor: 354000,
    currency: CURRENCY,
    status: "paid",
  },
  {
    id: "in-6",
    number: "INV-2026-0006",
    issued_at: "2026-06-14T00:00:00.000Z",
    period_start: "2026-06-14T00:00:00.000Z",
    period_end: "2026-07-14T00:00:00.000Z",
    seats: 5,
    amount_minor: 295000,
    currency: CURRENCY,
    status: "paid",
  },
  {
    id: "in-5",
    number: "INV-2026-0005",
    issued_at: "2026-05-14T00:00:00.000Z",
    period_start: "2026-05-14T00:00:00.000Z",
    period_end: "2026-06-14T00:00:00.000Z",
    seats: 5,
    amount_minor: 295000,
    currency: CURRENCY,
    status: "failed",
  },
  {
    id: "in-4",
    number: "INV-2026-0004",
    issued_at: "2026-04-14T00:00:00.000Z",
    period_start: "2026-04-14T00:00:00.000Z",
    period_end: "2026-05-14T00:00:00.000Z",
    seats: 4,
    amount_minor: 236000,
    currency: CURRENCY,
    status: "paid",
  },
];

let nextMemberId = members.length + 1;

const delay = (ms = 180) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Suspended members keep their history but release the seat they held. */
function seatsUsed(): number {
  return members.filter((m) => m.status !== "suspended").length;
}

function currentSubscription(): SubscriptionDto {
  return {
    ...subscription,
    seats_used: seatsUsed(),
    amount_minor: periodAmountMinor(subscription.plan, subscription.cycle, subscription.seats_total),
  };
}

function findMember(id: string): MemberDto {
  const member = members.find((m) => m.id === id);
  if (!member) throw new TeamApiError("team.error.missing");
  return member;
}

function activeOwners(): number {
  return members.filter((m) => m.role === "owner" && m.status === "active").length;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function brandOf(digits: string): string {
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  return "card";
}

export const teamApi = {
  listPlans(): Promise<PlanDto[]> {
    return delay(80).then(() => CATALOGUE.map((p) => ({ ...p })));
  },

  getSubscription(): Promise<SubscriptionDto> {
    return delay().then(() => currentSubscription());
  },

  /** Plan, cycle and seat count move together — one preview, one save. */
  async changeSubscription(next: {
    plan: PlanId;
    cycle: BillingCycle;
    seats: number;
  }): Promise<SubscriptionDto> {
    await delay(320);
    const plan = planById(next.plan);
    if (!Number.isInteger(next.seats)) throw new TeamApiError("billing.error.seatsInteger");
    if (next.seats < plan.min_seats) {
      throw new TeamApiError("billing.error.minSeats", { min: plan.min_seats });
    }
    if (next.seats > plan.max_seats) {
      throw new TeamApiError("billing.error.maxSeats", { max: plan.max_seats });
    }
    if (next.seats < seatsUsed()) {
      throw new TeamApiError("billing.error.seatsBelowUsed", { used: seatsUsed() });
    }
    subscription = { ...subscription, plan: next.plan, cycle: next.cycle, seats_total: next.seats };
    return currentSubscription();
  },

  /** Deferred cancellation — the workspace stays live until `renews_at`. */
  async setCancelAtPeriodEnd(flag: boolean): Promise<SubscriptionDto> {
    await delay(280);
    subscription = {
      ...subscription,
      cancel_at_period_end: flag,
      status: flag ? "canceled" : "active",
    };
    return currentSubscription();
  },

  getPaymentMethod(): Promise<PaymentMethodDto | null> {
    return delay().then(() => (payment ? { ...payment } : null));
  },

  /**
   * The real implementation hands the card number to the payment provider and
   * stores only what comes back; the checks here mirror what it will reject.
   */
  async updatePaymentMethod(input: {
    number: string;
    expiry: string;
    holder: string;
  }): Promise<PaymentMethodDto> {
    await delay(320);
    const digits = input.number.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) throw new TeamApiError("billing.error.cardNumber");
    const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(input.expiry.trim());
    if (!match) throw new TeamApiError("billing.error.cardExpiry");
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();
    const expired =
      year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    if (month < 1 || month > 12 || expired) throw new TeamApiError("billing.error.cardExpiry");
    if (!input.holder.trim()) throw new TeamApiError("billing.error.cardHolder");
    payment = {
      brand: brandOf(digits),
      last4: digits.slice(-4),
      exp_month: month,
      exp_year: year,
      holder: input.holder.trim().toUpperCase(),
    };
    // A working card clears the dunning state a failed charge left behind.
    if (subscription.status === "past_due") subscription = { ...subscription, status: "active" };
    return { ...payment };
  },

  getBillingProfile(): Promise<BillingProfileDto> {
    return delay().then(() => ({ ...profile }));
  },

  async updateBillingProfile(next: BillingProfileDto): Promise<BillingProfileDto> {
    await delay(300);
    if (!next.company.trim()) throw new TeamApiError("billing.error.company");
    // ЄДРПОУ is 8 digits for a legal entity, 10 for an individual entrepreneur.
    if (!/^(\d{8}|\d{10})$/.test(next.tax_id.trim())) throw new TeamApiError("billing.error.taxId");
    if (!EMAIL_RE.test(next.email.trim())) throw new TeamApiError("billing.error.email");
    profile = {
      company: next.company.trim(),
      tax_id: next.tax_id.trim(),
      email: next.email.trim(),
      address: next.address.trim(),
    };
    return { ...profile };
  },

  /** Newest first. */
  listInvoices(): Promise<InvoiceDto[]> {
    return delay().then(() => invoices.map((i) => ({ ...i })));
  },

  listMembers(): Promise<MemberDto[]> {
    return delay().then(() => members.map((m) => ({ ...m })));
  },

  async inviteMember(email: string, role: MemberRole): Promise<MemberDto> {
    await delay(320);
    const address = email.trim().toLowerCase();
    if (!EMAIL_RE.test(address)) throw new TeamApiError("team.error.badEmail");
    if (members.some((m) => m.email.toLowerCase() === address)) {
      throw new TeamApiError("team.error.duplicate");
    }
    if (seatsUsed() >= subscription.seats_total) throw new TeamApiError("team.error.noSeats");
    const member: MemberDto = {
      id: `m-${nextMemberId++}`,
      name: "",
      email: address,
      role,
      status: "invited",
      last_active_at: null,
    };
    members = [...members, member];
    return { ...member };
  },

  async updateMemberRole(id: string, role: MemberRole): Promise<MemberDto> {
    await delay(240);
    const member = findMember(id);
    if (member.role === "owner" && role !== "owner" && activeOwners() < 2) {
      throw new TeamApiError("team.error.lastOwner");
    }
    const updated = { ...member, role };
    members = members.map((m) => (m.id === id ? updated : m));
    return { ...updated };
  },

  /** Suspending frees the seat; reactivating needs a free one to take back. */
  async setMemberStatus(id: string, status: "active" | "suspended"): Promise<MemberDto> {
    await delay(240);
    const member = findMember(id);
    if (member.status === status) return { ...member };
    if (status === "suspended" && member.role === "owner") {
      throw new TeamApiError("team.error.ownerSuspend");
    }
    if (status === "active" && seatsUsed() >= subscription.seats_total) {
      throw new TeamApiError("team.error.noSeats");
    }
    const updated = { ...member, status };
    members = members.map((m) => (m.id === id ? updated : m));
    return { ...updated };
  },

  async resendInvite(id: string): Promise<MemberDto> {
    await delay(280);
    const member = findMember(id);
    if (member.status !== "invited") throw new TeamApiError("team.error.notInvited");
    return { ...member };
  },

  async removeMember(id: string): Promise<void> {
    await delay(280);
    const member = findMember(id);
    if (member.role === "owner" && activeOwners() < 2) {
      throw new TeamApiError("team.error.lastOwner");
    }
    members = members.filter((m) => m.id !== id);
  },
};
