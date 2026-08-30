/**
 * Team subscription: seats, billing and membership.
 *
 * The backend ships this contract — `ai-med-agent/docs/fe-billing.md`. Every
 * rejection arrives as `{ "detail": "<i18n key>", "params": {…} }`, so screens
 * localize the reason instead of printing a server sentence.
 *
 * `VITE_TEAM_FIXTURES=1` swaps in the offline stand-in (`./teamFixtures`) for
 * reviewing the screens on a laptop with no Stripe keys. It is off by default
 * and must never be the mode anything is demoed or accepted in.
 */
import { en } from "../i18n/strings";
import type { MessageKey } from "../i18n/strings";
import { ApiRequestError, apiUrl, request } from "./client";
import { fixtureTeamApi } from "./teamFixtures";
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

export * from "./teamTypes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isMessageKey(value: string): value is MessageKey {
  return Object.prototype.hasOwnProperty.call(en, value);
}

/**
 * Rejections arrive as message keys. Anything else — a 500 body, a proxy's
 * HTML, an unreachable backend — is not a key and must not be printed raw.
 */
function asTeamError(error: unknown): TeamApiError {
  if (error instanceof TeamApiError) return error;
  if (error instanceof ApiRequestError) {
    const key: MessageKey = isMessageKey(error.detail) ? error.detail : "error.generic";
    return new TeamApiError(key, error.params, error.status);
  }
  return new TeamApiError("error.generic");
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    throw asTeamError(error);
  }
}

function send<T>(method: string, path: string, payload?: unknown): Promise<T> {
  return call<T>(path, {
    method,
    headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

/**
 * Checkout and portal are **navigations**, not fetches: they answer 307 to a
 * Stripe-hosted page, so an XHR either trips CORS or silently follows the
 * redirect and hands back HTML.
 */
export function checkoutUrl(plan: PlanId, cycle: BillingCycle, seats: number): string {
  return apiUrl(`/billing/checkout/start?plan=${plan}&cycle=${cycle}&seats=${seats}`);
}

export function portalUrl(): string {
  return apiUrl("/billing/portal/start");
}

const liveTeamApi: TeamApi = {
  probe(): Promise<BillingProbeDto> {
    return call<BillingProbeDto>("/billing");
  },

  listPlans(): Promise<PlanDto[]> {
    return call<PlanDto[]>("/billing/plans");
  },

  getSubscription(): Promise<SubscriptionDto | null> {
    return call<SubscriptionDto | null>("/billing/subscription");
  },

  /** Plan, cycle and seat count move together — one prorated call, no portal detour. */
  changeSubscription(next: {
    plan: PlanId;
    cycle: BillingCycle;
    seats: number;
  }): Promise<SubscriptionDto> {
    return send<SubscriptionDto>("POST", "/billing/subscription", next);
  },

  /** Deferred and reversible — the workspace stays live until `renews_at`. */
  setCancelAtPeriodEnd(flag: boolean): Promise<SubscriptionDto> {
    return send<SubscriptionDto>("POST", "/billing/subscription/cancel", {
      cancel_at_period_end: flag,
    });
  },

  /**
   * Wanting to pay is never the hard path: this ends the free period today and
   * charges the card taken at checkout. Nothing is cancelled and nothing is
   * bought twice — the plan and the seat count come back unchanged.
   */
  endTrial(): Promise<SubscriptionDto> {
    return send<SubscriptionDto>("POST", "/billing/trial/end");
  },

  getPaymentMethod(): Promise<PaymentMethodDto | null> {
    return call<PaymentMethodDto | null>("/billing/payment-method");
  },

  /**
   * Answers a Stripe-hosted URL. The card number never reaches this service —
   * accepting one would put the whole deployment in PCI-DSS scope.
   */
  startPaymentMethodUpdate(): Promise<{ url: string }> {
    return send<{ url: string }>("POST", "/billing/payment-method");
  },

  getBillingProfile(): Promise<BillingProfileDto> {
    return call<BillingProfileDto>("/billing/profile");
  },

  /**
   * Validated here as well as server-side: the reader gets the answer without a
   * round trip, and the backend raises the same keys if anything slips past.
   */
  async updateBillingProfile(next: BillingProfileDto): Promise<BillingProfileDto> {
    if (!next.company.trim()) throw new TeamApiError("billing.error.company");
    // ЄДРПОУ is 8 digits for a legal entity, 10 for an individual entrepreneur.
    if (!/^(\d{8}|\d{10})$/.test(next.tax_id.trim())) throw new TeamApiError("billing.error.taxId");
    if (!EMAIL_RE.test(next.email.trim())) throw new TeamApiError("billing.error.email");
    return send<BillingProfileDto>("PUT", "/billing/profile", {
      company: next.company.trim(),
      tax_id: next.tax_id.trim(),
      email: next.email.trim(),
      address: next.address.trim(),
    });
  },

  /** Newest first. */
  listInvoices(): Promise<InvoiceDto[]> {
    return call<InvoiceDto[]>("/billing/invoices");
  },

  listMembers(): Promise<MemberDto[]> {
    return call<MemberDto[]>("/team/members");
  },

  async inviteMember(email: string, role: MemberRole): Promise<MemberDto> {
    const address = email.trim().toLowerCase();
    if (!EMAIL_RE.test(address)) throw new TeamApiError("team.error.badEmail");
    return send<MemberDto>("POST", "/team/members", { email: address, role });
  },

  /** `id` is the member UUID — stable across role and status changes. */
  updateMemberRole(id: string, role: MemberRole): Promise<MemberDto> {
    return send<MemberDto>("PATCH", `/team/members/${id}/role`, { role });
  },

  /** Suspending frees the seat; reactivating needs a free one to take back. */
  setMemberStatus(id: string, status: "active" | "suspended"): Promise<MemberDto> {
    return send<MemberDto>("PATCH", `/team/members/${id}/status`, { status });
  },

  resendInvite(id: string): Promise<MemberDto> {
    return send<MemberDto>("POST", `/team/members/${id}/invite`);
  },

  async removeMember(id: string): Promise<void> {
    await send<void>("DELETE", `/team/members/${id}`);
  },
};

/** Off unless explicitly asked for — see the module note. */
export const usingTeamFixtures = import.meta.env?.VITE_TEAM_FIXTURES === "1";

export const teamApi: TeamApi = usingTeamFixtures ? fixtureTeamApi : liveTeamApi;
