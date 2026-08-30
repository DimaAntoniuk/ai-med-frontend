/**
 * Offline stand-in for the team/billing surface.
 *
 * The backend now ships this contract for real (see `./team`), so this module
 * is an **offline convenience only**: it lets the two screens be opened and
 * reviewed on a laptop with no Stripe keys configured, where `GET /billing`
 * answers `available: false` and every other route 404s.
 *
 * It is off unless `VITE_TEAM_FIXTURES=1`. Never demo or accept against it —
 * the rules below are a copy of the backend's, and a copy drifts.
 *
 * Nothing here reaches the network; changes live for the lifetime of the tab.
 */
import {
  TeamApiError,
  type BillingCycle,
  type BillingProbeDto,
  type BillingProfileDto,
  type InvoiceDto,
  type MemberDto,
  type MemberRole,
  type PaymentMethodDto,
  type PlanDto,
  type PlanId,
  type SubscriptionDto,
  type TeamApi,
} from "./teamTypes";

const CURRENCY = "UAH";

const CATALOGUE: PlanDto[] = [
  { id: "solo", monthly_minor: 69000, annual_minor: 57500, min_seats: 1, max_seats: 1 },
  { id: "team", monthly_minor: 59000, annual_minor: 49000, min_seats: 2, max_seats: 25 },
  { id: "clinic", monthly_minor: 49000, annual_minor: 41000, min_seats: 10, max_seats: 200 },
];

function planById(id: PlanId): PlanDto {
  return CATALOGUE.find((p) => p.id === id) ?? CATALOGUE[1];
}

function seatPriceMinor(plan: PlanId, cycle: BillingCycle): number {
  const entry = planById(plan);
  return cycle === "annual" ? entry.annual_minor : entry.monthly_minor;
}

/** What one period costs: the annual cycle charges twelve months up front. */
function periodAmountMinor(plan: PlanId, cycle: BillingCycle, seats: number): number {
  return seatPriceMinor(plan, cycle) * seats * (cycle === "annual" ? 12 : 1);
}

type StoredSubscription = Omit<SubscriptionDto, "seats_used" | "amount_minor">;

/**
 * Starts mid-trial so the free-period banner and the "start paying now" path
 * can be looked at offline — the surface most in need of a second pair of eyes.
 * The invoice history below is stand-in scenery rather than a coherent Stripe
 * timeline (a real trial precedes every invoice); see the module note.
 */
let subscription: StoredSubscription = {
  plan: "team",
  cycle: "monthly",
  status: "active",
  seats_total: 6,
  currency: CURRENCY,
  renews_at: "2026-09-14T00:00:00.000Z",
  cancel_at_period_end: false,
  trial_ends_at: "2026-09-14T00:00:00.000Z",
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

export const fixtureTeamApi: TeamApi = {
  probe(): Promise<BillingProbeDto> {
    return delay(60).then(() => ({
      available: true,
      subscribed: subscription.status !== "canceled" || subscription.cancel_at_period_end,
      role: "owner" as MemberRole,
      subscription: currentSubscription(),
      // Already spent: this workspace has bought something, so nothing here
      // should advertise a free period a second time.
      trial_days: 0,
    }));
  },

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

  /**
   * Wanting to pay is never the hard path: the free period ends today and the
   * charge falls on the card already taken at checkout. The plan, the cycle and
   * the seat count are untouched — this is not a cancellation.
   */
  async endTrial(): Promise<SubscriptionDto> {
    await delay(280);
    if (subscription.trial_ends_at === null) throw new TeamApiError("billing.error.notTrialing");
    subscription = { ...subscription, trial_ends_at: null };
    return currentSubscription();
  },

  getPaymentMethod(): Promise<PaymentMethodDto | null> {
    return delay().then(() => (payment ? { ...payment } : null));
  },

  /**
   * The card is the payment provider's to collect — posting a PAN here would
   * put the deployment in PCI-DSS scope. The real route answers a hosted URL;
   * offline there is nowhere to send the reader, so this reports as much.
   */
  async startPaymentMethodUpdate(): Promise<{ url: string }> {
    await delay(200);
    throw new TeamApiError("billing.error.fixtureCard");
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
