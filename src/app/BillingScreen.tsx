import { useCallback, useEffect, useRef, useState } from "react";
import {
  TeamApiError,
  checkoutUrl,
  periodAmountMinor,
  planById,
  portalUrl,
  seatPriceMinor,
  teamApi,
  usingTeamFixtures,
  type BillingCycle,
  type BillingProbeDto,
  type BillingProfileDto,
  type InvoiceDto,
  type InvoiceStatus,
  type PaymentMethodDto,
  type PlanDto,
  type PlanId,
  type SubscriptionDto,
} from "../api/team";
import { Badge } from "../design/data/Badge";
import { Card } from "../design/data/Card";
import { Table } from "../design/data/Table";
import { Alert } from "../design/feedback/Alert";
import { Dialog } from "../design/feedback/Dialog";
import { Button } from "../design/forms/Button";
import { Input } from "../design/forms/Input";
import { useSettings } from "../i18n";
import type { MessageKey } from "../i18n/strings";
import { formatDate, formatMoney, formatPeriod } from "./billingFormat";

const PLAN_NAME: Record<PlanId, MessageKey> = {
  solo: "billing.plan.solo",
  team: "billing.plan.team",
  clinic: "billing.plan.clinic",
};

const PLAN_TAGLINE: Record<PlanId, MessageKey> = {
  solo: "billing.plan.solo.tagline",
  team: "billing.plan.team.tagline",
  clinic: "billing.plan.clinic.tagline",
};

const PLAN_FEATURES: Record<PlanId, MessageKey[]> = {
  solo: ["billing.feature.runs", "billing.feature.history", "billing.feature.audit"],
  team: [
    "billing.feature.seats",
    "billing.feature.sharedHistory",
    "billing.feature.runs",
    "billing.feature.audit",
  ],
  clinic: [
    "billing.feature.sso",
    "billing.feature.dpa",
    "billing.feature.priority",
    "billing.feature.audit",
  ],
};

const INVOICE_TONE: Record<InvoiceStatus, "success" | "warning" | "critical"> = {
  paid: "success",
  open: "warning",
  failed: "critical",
};

const INVOICE_LABEL: Record<InvoiceStatus, MessageKey> = {
  paid: "billing.invoice.paid",
  open: "billing.invoice.open",
  failed: "billing.invoice.failed",
};

/**
 * The catalogue quotes amounts without a currency — only a live subscription
 * carries one. Until there is one, prices are shown in the currency every plan
 * is priced in.
 */
const DEFAULT_CURRENCY = "UAH";

/**
 * The sales-led plan: not priced in Stripe, so the backend never lists it and
 * it cannot be bought in-app. It still belongs on the pricing wall — a clinic
 * that needs it should see it exists and be able to reach someone.
 */
const SALES_PLAN: PlanId = "clinic";

/**
 * Where "Book a demo" goes. Unset in a plain checkout, and the card then states
 * the plan without offering a button — a dead link is worse than no link.
 */
const CONTACT_SALES_URL: string = import.meta.env?.VITE_CONTACT_SALES_URL ?? "";

interface BillingData {
  probe: BillingProbeDto;
  /** null until the workspace has bought a subscription at all. */
  subscription: SubscriptionDto | null;
  plans: PlanDto[];
  payment: PaymentMethodDto | null;
  profile: BillingProfileDto | null;
  invoices: InvoiceDto[];
}

interface PlanDraft {
  plan: PlanId;
  cycle: BillingCycle;
  seats: string;
}

/** Used/total seat bar. Turns amber once every seat is taken. */
function SeatMeter({ used, total }: { used: number; total: number }) {
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  const full = used >= total;
  return (
    <div
      style={{
        height: 6,
        borderRadius: "var(--r-full)",
        background: "var(--surface-sunken)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${ratio * 100}%`,
          height: "100%",
          borderRadius: "var(--r-full)",
          background: full ? "var(--warning)" : "var(--primary)",
          transition: "width 200ms ease",
        }}
      />
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
      <span style={{ flex: "0 0 148px", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: "var(--text-base)",
          color: "var(--text-primary)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The plan catalogue as square, selectable cards.
 *
 * Each card carries only what decides the choice: the name, the per-seat price
 * on the chosen cycle, the seat band, and the handful of features that separate
 * this plan from the one beside it. Everything else — proration, the invoice,
 * the card — belongs to the steps after the choice, not to the choice.
 */
function PlanCards({
  plans,
  cycle,
  selected,
  current,
  currency,
  locale,
  onSelect,
  t,
}: {
  plans: PlanDto[];
  cycle: BillingCycle;
  selected: PlanId;
  current: PlanId | null;
  currency: string;
  locale: Parameters<typeof formatMoney>[2];
  onSelect: (plan: PlanId) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}) {
  // Absent from the catalogue means unpriced, which for this one plan is the
  // intended state rather than a gap: it is sold by a conversation.
  const salesLed = !plans.some((plan) => plan.id === SALES_PLAN);
  return (
    <div
      style={{
        display: "grid",
        // Square-ish tiles that collapse to one column on a narrow viewport.
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 12,
      }}
    >
      {/* `display: contents` lets the tiles sit in the grid while the group
          still owns only radios — the sales tile is not one of the options. */}
      <div
        role="radiogroup"
        aria-label={t("billing.dialog.planTitle")}
        style={{ display: "contents" }}
      >
      {plans.map((plan) => {
        const active = plan.id === selected;
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(plan.id)}
            style={{
              appearance: "none",
              cursor: "pointer",
              textAlign: "left",
              minHeight: 210,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 16,
              borderRadius: "var(--r-lg)",
              fontFamily: "var(--font-ui)",
              background: active ? "var(--primary-tint)" : "var(--surface-card)",
              border: `1.5px solid ${active ? "var(--primary)" : "var(--border-subtle)"}`,
              boxShadow: active ? "var(--shadow-sm)" : "none",
              transition: "border-color 120ms ease, background 120ms ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--weight-bold)",
                  color: "var(--text-primary)",
                }}
              >
                {t(PLAN_NAME[plan.id])}
              </span>
              {plan.id === current && <Badge tone="neutral">{t("billing.dialog.current")}</Badge>}
            </div>

            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-secondary)",
                lineHeight: 1.35,
              }}
            >
              {t(PLAN_TAGLINE[plan.id])}
            </div>

            <div>
              <div
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--weight-bold)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1.1,
                }}
              >
                {formatMoney(seatPriceMinor(plan, cycle), currency, locale)}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                {t("billing.perSeatCaption")}
              </div>
            </div>

            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              {t("billing.dialog.seatsRange", { min: plan.min_seats, max: plan.max_seats })}
            </div>

            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: "auto",
              }}
            >
              {PLAN_FEATURES[plan.id].slice(0, 3).map((key) => (
                <li
                  key={key}
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-secondary)",
                    display: "flex",
                    gap: 6,
                    lineHeight: 1.35,
                  }}
                >
                  <span aria-hidden style={{ color: "var(--primary)" }}>✓</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
      </div>
      {salesLed && <SalesCard t={t} />}
    </div>
  );
}

/**
 * The one tile that does not sell anything: same shape as a plan card, but
 * where the price would be there is an invitation to talk. It is deliberately
 * not selectable — nothing here can be put through checkout.
 */
function SalesCard({
  t,
}: {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}) {
  return (
    <div
      style={{
        minHeight: 210,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 16,
        borderRadius: "var(--r-lg)",
        background: "var(--surface-card)",
        // Dashed: this one is quoted, not listed.
        border: "1.5px dashed var(--border-subtle)",
      }}
    >
      <span
        style={{
          fontSize: "var(--text-base)",
          fontWeight: "var(--weight-bold)",
          color: "var(--text-primary)",
        }}
      >
        {t(PLAN_NAME[SALES_PLAN])}
      </span>

      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.35 }}>
        {t(PLAN_TAGLINE[SALES_PLAN])}
      </div>

      <div>
        <div
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-bold)",
            color: "var(--text-primary)",
            lineHeight: 1.1,
          }}
        >
          {t("billing.sales.price")}
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          {t("billing.sales.caption")}
        </div>
      </div>

      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {PLAN_FEATURES[SALES_PLAN].slice(0, 3).map((key) => (
          <li
            key={key}
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              display: "flex",
              gap: 6,
              lineHeight: 1.35,
            }}
          >
            <span aria-hidden style={{ color: "var(--primary)" }}>✓</span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>

      {CONTACT_SALES_URL && (
        <div style={{ marginTop: "auto" }}>
          <Button
            variant="secondary"
            onClick={() => window.open(CONTACT_SALES_URL, "_blank", "noopener,noreferrer")}
          >
            {t("billing.sales.action")}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Team subscription billing: the plan and its seat count, the payment method,
 * the invoice-header details and the invoice history. Seat count is the hinge
 * between this screen and the team screen — inviting a member consumes one.
 */
export function BillingScreen({ openPlanOnMount = false }: { openPlanOnMount?: boolean }) {
  const { t, locale } = useSettings();
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [planDraft, setPlanDraft] = useState<PlanDraft | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  /**
   * Set while the browser is on its way to a provider-hosted page — checkout,
   * the portal, or the card form. The controls stay disabled until it leaves.
   */
  const [leaving, setLeaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState<BillingProfileDto | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const describe = useCallback(
    (e: unknown) => (e instanceof TeamApiError ? t(e.key, e.params) : t("error.generic")),
    [t],
  );

  /**
   * The probe decides how much of this screen exists at all: billing may be off
   * on this deployment, and the card, invoices and profile are the owner's
   * alone — asking for them as an admin would earn a 403 for a control that
   * should never have been rendered.
   */
  const load = useCallback(async (): Promise<BillingData> => {
    const probe = await teamApi.probe();
    if (!probe.available) {
      return { probe, subscription: null, plans: [], payment: null, profile: null, invoices: [] };
    }
    const plans = await teamApi.listPlans();
    if (probe.role !== "owner") {
      return { probe, subscription: probe.subscription, plans, payment: null, profile: null, invoices: [] };
    }
    const [subscription, payment, profile, invoices] = await Promise.all([
      teamApi.getSubscription(),
      teamApi.getPaymentMethod(),
      teamApi.getBillingProfile(),
      teamApi.listInvoices(),
    ]);
    return { probe, subscription, plans, payment, profile, invoices };
  }, []);

  useEffect(() => {
    let live = true;
    load()
      .then((next) => {
        if (live) setData(next);
      })
      .catch((e) => {
        if (live) setError(describe(e));
      });
    return () => {
      live = false;
    };
  }, [describe, load]);

  /**
   * Returning from Stripe with `?billing=success` means *paid*, not
   * *provisioned* — the seat is granted when the webhook lands, which may be
   * either side of the browser getting back. Poll briefly, then stop guessing.
   */
  const [settling, setSettling] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("billing");
    if (!outcome) return;
    params.delete("billing");
    const rest = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash,
    );
    if (outcome !== "success") return;

    let live = true;
    let attempts = 0;
    setSettling(true);
    const tick = async () => {
      attempts += 1;
      try {
        const next = await load();
        if (!live) return;
        if (next.probe.subscribed || attempts >= 6) {
          setData(next);
          setSettling(false);
          return;
        }
      } catch {
        if (!live) return;
        if (attempts >= 6) {
          setSettling(false);
          return;
        }
      }
      window.setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      live = false;
    };
  }, [load]);

  /**
   * The same dialog serves both jobs. With a subscription it opens on what the
   * workspace already pays for; without one it is the first purchase, so it
   * opens on the middle plan at its smallest legal seat count.
   */
  const openPlanDialog = useCallback((subscription: SubscriptionDto | null, plans: PlanDto[]) => {
    setPlanError(null);
    if (subscription) {
      setPlanDraft({
        plan: subscription.plan,
        cycle: subscription.cycle,
        seats: String(subscription.seats_total),
      });
      return;
    }
    const start = planById(plans, "team") ?? plans[0];
    if (!start) return;
    setPlanDraft({ plan: start.id, cycle: "monthly", seats: String(start.min_seats) });
  }, []);

  // Arriving from the team screen's "add seats" prompt lands straight in the
  // dialog — once, so closing it does not immediately reopen it.
  const focusHandled = useRef(false);
  useEffect(() => {
    if (!openPlanOnMount || focusHandled.current || !data) return;
    if (!data.probe.available || data.probe.role !== "owner") return;
    focusHandled.current = true;
    openPlanDialog(data.subscription, data.plans);
  }, [openPlanOnMount, data, openPlanDialog]);

  if (error && !data) {
    return (
      <Alert tone="critical" title={t("error.title")}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
        {t("billing.loading")}
      </span>
    );
  }

  const { probe, subscription, plans, payment, profile, invoices } = data;

  // Nothing below exists on a deployment with no payment provider configured.
  if (!probe.available) {
    return (
      <Alert tone="info" title={t("team.unavailable.title")}>
        {t("team.unavailable.body")}
      </Alert>
    );
  }

  // The card, the invoices and the invoice header are the owner's alone — every
  // route behind them answers 403 to anyone else, so no control is offered.
  const isOwner = probe.role === "owner";

  const freeSeats = subscription
    ? Math.max(subscription.seats_total - subscription.seats_used, 0)
    : 0;
  const currency = subscription?.currency ?? DEFAULT_CURRENCY;
  const subscribedPlan = subscription ? planById(plans, subscription.plan) : null;
  const perSeat = subscription && subscribedPlan ? seatPriceMinor(subscribedPlan, subscription.cycle) : 0;
  const totalKey: MessageKey =
    subscription?.cycle === "annual" ? "billing.total.annual" : "billing.total.monthly";

  const draftLimits = planDraft ? planById(plans, planDraft.plan) : null;
  const draftSeats = planDraft ? Number(planDraft.seats) : 0;
  const draftValid =
    planDraft !== null &&
    draftLimits !== null &&
    Number.isInteger(draftSeats) &&
    draftSeats >= draftLimits.min_seats &&
    draftSeats <= draftLimits.max_seats;
  const draftPerSeat = planDraft && draftLimits ? seatPriceMinor(draftLimits, planDraft.cycle) : 0;

  /**
   * With a subscription this is a prorated change, applied in place. Without
   * one it is the first purchase, which only the provider's checkout can take —
   * a navigation, never a fetch, since the route answers a 307 to their host.
   */
  const savePlan = async () => {
    if (!planDraft || !draftValid) return;
    if (!subscription) {
      setLeaving(true);
      window.location.assign(checkoutUrl(planDraft.plan, planDraft.cycle, draftSeats));
      return;
    }
    setBusy(true);
    setPlanError(null);
    try {
      const next = await teamApi.changeSubscription({
        plan: planDraft.plan,
        cycle: planDraft.cycle,
        seats: draftSeats,
      });
      setData({ ...data, subscription: next, probe: { ...probe, subscription: next } });
      setPlanDraft(null);
    } catch (e) {
      setPlanError(describe(e));
    } finally {
      setBusy(false);
    }
  };

  /**
   * The card number never touches this app. The route hands back a URL on the
   * provider's own domain and the browser goes there; anything else would drag
   * the whole deployment into PCI-DSS scope.
   */
  const openCardPage = async () => {
    setLeaving(true);
    setError(null);
    try {
      const { url } = await teamApi.startPaymentMethodUpdate();
      window.location.assign(url);
    } catch (e) {
      setError(describe(e));
      setLeaving(false);
    }
  };

  const saveProfile = async () => {
    if (!profileDraft) return;
    setBusy(true);
    setProfileError(null);
    try {
      const next = await teamApi.updateBillingProfile(profileDraft);
      setData({ ...data, profile: next });
      setProfileDraft(null);
    } catch (e) {
      setProfileError(describe(e));
    } finally {
      setBusy(false);
    }
  };

  const setCancellation = async (flag: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const next = await teamApi.setCancelAtPeriodEnd(flag);
      setData({ ...data, subscription: next, probe: { ...probe, subscription: next } });
      setCancelOpen(false);
    } catch (e) {
      setError(describe(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {error && (
        <Alert tone="critical" title={t("error.title")} onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {settling && (
        <Alert tone="info" title={t("billing.settling.title")}>
          {t("billing.settling.body")}
        </Alert>
      )}

      {subscription?.status === "past_due" && (
        <Alert
          tone="critical"
          title={t("billing.pastDue.title")}
          action={
            isOwner ? (
              <Button size="sm" variant="secondary" disabled={leaving} onClick={openCardPage}>
                {leaving ? t("billing.payment.opening") : t("billing.pastDue.action")}
              </Button>
            ) : undefined
          }
        >
          {t("billing.pastDue.body")}
        </Alert>
      )}

      {subscription?.cancel_at_period_end && (
        <Alert
          tone="warning"
          title={t("billing.canceled.title", { date: formatDate(subscription.renews_at, locale) })}
          action={
            isOwner ? (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setCancellation(false)}>
                {busy ? t("billing.resuming") : t("billing.resume")}
              </Button>
            ) : undefined
          }
        >
          {t("billing.canceled.body")}
        </Alert>
      )}

      {!subscription && (
        <Card title={t("billing.plan.title")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--text-primary)",
              }}
            >
              {t("billing.empty.title")}
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
              {isOwner ? t("billing.empty.body") : t("billing.readOnly")}
            </span>
            {isOwner && (
              <div>
                <Button variant="primary" onClick={() => openPlanDialog(null, plans)}>
                  {t("billing.empty.action")}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {subscription && (
      <Card
        title={t("billing.plan.title")}
        action={
          isOwner ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openPlanDialog(subscription, plans)}
            >
              {t("billing.plan.change")}
            </Button>
          ) : undefined
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--weight-bold)",
                    color: "var(--text-primary)",
                  }}
                >
                  {t(PLAN_NAME[subscription.plan])}
                </span>
                <Badge tone="primary">
                  {t(
                    subscription.cycle === "annual"
                      ? "billing.cycle.annual"
                      : "billing.cycle.monthly",
                  )}
                </Badge>
              </div>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                {t(PLAN_TAGLINE[subscription.plan])}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--weight-semibold)",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                }}
              >
                {t(totalKey, {
                  amount: formatMoney(subscription.amount_minor, subscription.currency, locale),
                })}
              </div>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
                {t("billing.perSeatMonth", {
                  amount: formatMoney(perSeat, subscription.currency, locale),
                })}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                {t("billing.seats.inUse", {
                  used: subscription.seats_used,
                  total: subscription.seats_total,
                })}
              </span>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: freeSeats === 0 ? "var(--warning)" : "var(--text-tertiary)",
                }}
              >
                {freeSeats === 0
                  ? t("billing.seats.none")
                  : t("billing.seats.free", { count: freeSeats })}
              </span>
            </div>
            <SeatMeter used={subscription.seats_used} total={subscription.seats_total} />
          </div>

          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            {PLAN_FEATURES[subscription.plan].map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>

          {!subscription.cancel_at_period_end && (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {t("billing.renewsOn", { date: formatDate(subscription.renews_at, locale) })}
            </span>
          )}
        </div>
      </Card>
      )}

      {subscription && isOwner && (
      <Card
        title={t("billing.payment.title")}
        action={
          <Button size="sm" variant="secondary" disabled={leaving} onClick={openCardPage}>
            {leaving
              ? t("billing.payment.opening")
              : payment
                ? t("billing.payment.update")
                : t("billing.payment.add")}
          </Button>
        }
        footer={
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
            {t("billing.payment.notice")}
          </span>
        }
      >
        {payment ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge tone="neutral">{payment.brand.toUpperCase()}</Badge>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-base)" }}>
                •••• •••• •••• {payment.last4}
              </span>
            </div>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
              {payment.holder} ·{" "}
              {t("billing.payment.expires", {
                month: String(payment.exp_month).padStart(2, "0"),
                year: String(payment.exp_year).slice(-2),
              })}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {t("billing.payment.none")}
          </span>
        )}
      </Card>
      )}

      {subscription && isOwner && profile && (
      <Card
        title={t("billing.profile.title")}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setProfileError(null);
              setProfileDraft({ ...profile });
            }}
          >
            {t("billing.profile.edit")}
          </Button>
        }
        footer={
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
            {t("billing.profile.note")}
          </span>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <DetailRow label={t("billing.profile.company")} value={profile.company} />
          <DetailRow label={t("billing.profile.taxId")} value={profile.tax_id} mono />
          <DetailRow label={t("billing.profile.email")} value={profile.email} />
          <DetailRow label={t("billing.profile.address")} value={profile.address} />
        </div>
      </Card>
      )}

      {subscription && isOwner && (
      <Card
        title={t("billing.invoices.title")}
        footer={
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
            {t("billing.invoices.note")}
          </span>
        }
      >
        {invoices.length === 0 ? (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {t("billing.invoices.empty")}
          </span>
        ) : (
          <Table
            dense
            columns={[
              { key: "number", label: t("billing.invoices.number"), mono: true, nowrap: true },
              {
                key: "period",
                label: t("billing.invoices.period"),
                nowrap: true,
                render: (row: InvoiceDto) => formatPeriod(row.period_start, row.period_end, locale),
              },
              {
                key: "seats",
                label: t("billing.invoices.seats"),
                align: "right",
                mono: true,
              },
              {
                key: "amount",
                label: t("billing.invoices.amount"),
                align: "right",
                mono: true,
                nowrap: true,
                render: (row: InvoiceDto) => formatMoney(row.amount_minor, row.currency, locale),
              },
              {
                key: "status",
                label: t("billing.invoices.status"),
                align: "right",
                nowrap: true,
                render: (row: InvoiceDto) => (
                  <Badge tone={INVOICE_TONE[row.status]} dot>
                    {t(INVOICE_LABEL[row.status])}
                  </Badge>
                ),
              },
            ]}
            rows={invoices}
          />
        )}
      </Card>
      )}

      {subscription && isOwner && (
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span
            style={{ flex: 1, minWidth: 220, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
          >
            {t("billing.portal.note")}
          </span>
          {/* A 307 to the provider's host: a navigation, never a fetch. */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.assign(portalUrl())}
          >
            {t("billing.portal")}
          </Button>
        </div>
      </Card>
      )}

      {subscription && isOwner && (
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span
            style={{ flex: 1, minWidth: 220, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
          >
            {t("billing.cancel.note")}
          </span>
          {subscription.cancel_at_period_end ? (
            <Button variant="primary" size="sm" disabled={busy} onClick={() => setCancellation(false)}>
              {busy ? t("billing.resuming") : t("billing.resume")}
            </Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
              {t("billing.cancel")}
            </Button>
          )}
        </div>
      </Card>
      )}

      {subscription && !isOwner && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          {t("billing.readOnly")}
        </span>
      )}

      {usingTeamFixtures && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          {t("team.backendNote")}
        </span>
      )}

      <Dialog
        open={planDraft !== null}
        title={subscription ? t("billing.dialog.planTitle") : t("billing.checkout.title")}
        subtitle={subscription ? t("billing.dialog.planSubtitle") : t("billing.checkout.subtitle")}
        // Wide enough for three plan cards side by side; they wrap below that.
        width={720}
        onClose={busy || leaving ? undefined : () => setPlanDraft(null)}
        footer={
          <>
            <Button
              variant="ghost"
              disabled={busy || leaving}
              onClick={() => setPlanDraft(null)}
            >
              {t("billing.close")}
            </Button>
            <Button
              variant="primary"
              disabled={busy || leaving || !draftValid}
              onClick={savePlan}
            >
              {busy || leaving
                ? t("billing.saving")
                : subscription
                  ? t("billing.save")
                  : t("billing.checkout.continue")}
            </Button>
          </>
        }
      >
        {planDraft && draftLimits && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {planError && <Alert tone="critical">{planError}</Alert>}

            {/* The cycle is picked first: it changes every price on the cards. */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div
                role="radiogroup"
                aria-label={t("billing.cycle.switch")}
                style={{
                  display: "inline-flex",
                  gap: 3,
                  padding: 3,
                  borderRadius: "var(--r-full)",
                  background: "var(--surface-sunken)",
                }}
              >
                {(["monthly", "annual"] as const).map((cycle) => {
                  const active = planDraft.cycle === cycle;
                  return (
                    <button
                      key={cycle}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPlanDraft({ ...planDraft, cycle })}
                      style={{
                        appearance: "none",
                        cursor: "pointer",
                        border: "none",
                        borderRadius: "var(--r-full)",
                        padding: "5px 14px",
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--text-sm)",
                        fontWeight: active ? "var(--weight-semibold)" : "var(--weight-regular)",
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                        background: active ? "var(--surface-card)" : "transparent",
                        boxShadow: active ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      {t(cycle === "annual" ? "billing.cycle.annual" : "billing.cycle.monthly")}
                    </button>
                  );
                })}
              </div>
              <Badge tone="success">{t("billing.cycle.annualBadge")}</Badge>
            </div>

            <PlanCards
              plans={plans}
              cycle={planDraft.cycle}
              selected={planDraft.plan}
              current={subscription?.plan ?? null}
              currency={currency}
              locale={locale}
              t={t}
              onSelect={(id) => {
                // Seat bands differ per plan, so a count legal on one plan can
                // be illegal on the next — carry it into the new band.
                const next = planById(plans, id);
                const seats = next
                  ? Math.min(Math.max(draftSeats || next.min_seats, next.min_seats), next.max_seats)
                  : draftSeats;
                setPlanDraft({ ...planDraft, plan: id, seats: String(seats) });
              }}
            />

            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <Input
                label={t("billing.seats.label")}
                type="number"
                min={draftLimits.min_seats}
                max={draftLimits.max_seats}
                mono
                value={planDraft.seats}
                hint={t("billing.seats.hint", {
                  min: draftLimits.min_seats,
                  max: draftLimits.max_seats,
                })}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPlanDraft({ ...planDraft, seats: e.target.value })
                }
                style={{ width: 140 }}
              />

              {draftValid && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 220,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    background: "var(--primary-tint)",
                    border: "1px solid var(--primary-border)",
                    borderRadius: "var(--r-md)",
                    padding: "12px 14px",
                  }}
                >
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                    {t("billing.dialog.totalLabel")}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-xl)",
                      fontWeight: "var(--weight-bold)",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {t(
                      planDraft.cycle === "annual"
                        ? "billing.total.annual"
                        : "billing.total.monthly",
                      {
                        amount: formatMoney(
                          periodAmountMinor(draftLimits, planDraft.cycle, draftSeats),
                          currency,
                          locale,
                        ),
                      },
                    )}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                    {t("billing.dialog.summary", {
                      seats: draftSeats,
                      perSeat: formatMoney(draftPerSeat, currency, locale),
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={profileDraft !== null}
        title={t("billing.profile.dialogTitle")}
        width={520}
        onClose={busy ? undefined : () => setProfileDraft(null)}
        footer={
          <>
            <Button variant="ghost" disabled={busy} onClick={() => setProfileDraft(null)}>
              {t("billing.close")}
            </Button>
            <Button variant="primary" disabled={busy} onClick={saveProfile}>
              {busy ? t("billing.saving") : t("billing.save")}
            </Button>
          </>
        }
      >
        {profileDraft && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {profileError && <Alert tone="critical">{profileError}</Alert>}
            <Input
              label={t("billing.profile.company")}
              required
              value={profileDraft.company}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setProfileDraft({ ...profileDraft, company: e.target.value })
              }
            />
            <Input
              label={t("billing.profile.taxId")}
              required
              mono
              inputMode="numeric"
              value={profileDraft.tax_id}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setProfileDraft({ ...profileDraft, tax_id: e.target.value })
              }
              style={{ maxWidth: 200 }}
            />
            <Input
              label={t("billing.profile.email")}
              required
              type="email"
              value={profileDraft.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setProfileDraft({ ...profileDraft, email: e.target.value })
              }
            />
            <Input
              label={t("billing.profile.address")}
              value={profileDraft.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setProfileDraft({ ...profileDraft, address: e.target.value })
              }
            />
          </div>
        )}
      </Dialog>

      <Dialog
        open={cancelOpen && subscription !== null}
        title={t("billing.cancel.title")}
        width={460}
        onClose={busy ? undefined : () => setCancelOpen(false)}
        footer={
          <>
            <Button variant="ghost" disabled={busy} onClick={() => setCancelOpen(false)}>
              {t("billing.cancel.keep")}
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => setCancellation(true)}>
              {busy ? t("billing.saving") : t("billing.cancel.confirm")}
            </Button>
          </>
        }
      >
        {subscription && (
          <span style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
            {t("billing.cancel.body", { date: formatDate(subscription.renews_at, locale) })}
          </span>
        )}
      </Dialog>
    </div>
  );
}
