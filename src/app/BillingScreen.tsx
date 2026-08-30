import { useCallback, useEffect, useRef, useState } from "react";
import {
  TeamApiError,
  periodAmountMinor,
  planById,
  seatPriceMinor,
  teamApi,
  type BillingCycle,
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
import { RadioGroup } from "../design/forms/Checkbox";
import { Input } from "../design/forms/Input";
import { Switch } from "../design/forms/Switch";
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

interface BillingData {
  subscription: SubscriptionDto;
  plans: PlanDto[];
  payment: PaymentMethodDto | null;
  profile: BillingProfileDto;
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
  const [cardDraft, setCardDraft] = useState<{
    number: string;
    expiry: string;
    holder: string;
  } | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<BillingProfileDto | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const describe = useCallback(
    (e: unknown) => (e instanceof TeamApiError ? t(e.key, e.params) : t("error.generic")),
    [t],
  );

  useEffect(() => {
    let live = true;
    Promise.all([
      teamApi.getSubscription(),
      teamApi.listPlans(),
      teamApi.getPaymentMethod(),
      teamApi.getBillingProfile(),
      teamApi.listInvoices(),
    ])
      .then(([subscription, plans, payment, profile, invoices]) => {
        if (live) setData({ subscription, plans, payment, profile, invoices });
      })
      .catch((e) => {
        if (live) setError(describe(e));
      });
    return () => {
      live = false;
    };
  }, [describe]);

  const openPlanDialog = useCallback((subscription: SubscriptionDto) => {
    setPlanError(null);
    setPlanDraft({
      plan: subscription.plan,
      cycle: subscription.cycle,
      seats: String(subscription.seats_total),
    });
  }, []);

  // Arriving from the team screen's "add seats" prompt lands straight in the
  // dialog — once, so closing it does not immediately reopen it.
  const focusHandled = useRef(false);
  useEffect(() => {
    if (!openPlanOnMount || focusHandled.current || !data) return;
    focusHandled.current = true;
    openPlanDialog(data.subscription);
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

  const { subscription, plans, payment, profile, invoices } = data;
  const freeSeats = Math.max(subscription.seats_total - subscription.seats_used, 0);
  const perSeat = seatPriceMinor(subscription.plan, subscription.cycle);
  const totalKey: MessageKey =
    subscription.cycle === "annual" ? "billing.total.annual" : "billing.total.monthly";

  const draftSeats = planDraft ? Number(planDraft.seats) : 0;
  const draftValid = planDraft !== null && Number.isInteger(draftSeats) && draftSeats > 0;
  const draftPerSeat = planDraft ? seatPriceMinor(planDraft.plan, planDraft.cycle) : 0;
  const draftLimits = planDraft ? planById(planDraft.plan) : null;

  const savePlan = async () => {
    if (!planDraft) return;
    setBusy(true);
    setPlanError(null);
    try {
      const next = await teamApi.changeSubscription({
        plan: planDraft.plan,
        cycle: planDraft.cycle,
        seats: Number(planDraft.seats),
      });
      setData({ ...data, subscription: next });
      setPlanDraft(null);
    } catch (e) {
      setPlanError(describe(e));
    } finally {
      setBusy(false);
    }
  };

  const saveCard = async () => {
    if (!cardDraft) return;
    setBusy(true);
    setCardError(null);
    try {
      const next = await teamApi.updatePaymentMethod(cardDraft);
      const subscriptionAfter = await teamApi.getSubscription();
      setData({ ...data, payment: next, subscription: subscriptionAfter });
      setCardDraft(null);
    } catch (e) {
      setCardError(describe(e));
    } finally {
      setBusy(false);
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
      setData({ ...data, subscription: next });
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

      {subscription.status === "past_due" && (
        <Alert
          tone="critical"
          title={t("billing.pastDue.title")}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setCardDraft({ number: "", expiry: "", holder: payment?.holder ?? "" })
              }
            >
              {t("billing.pastDue.action")}
            </Button>
          }
        >
          {t("billing.pastDue.body")}
        </Alert>
      )}

      {subscription.cancel_at_period_end && (
        <Alert
          tone="warning"
          title={t("billing.canceled.title", { date: formatDate(subscription.renews_at, locale) })}
          action={
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setCancellation(false)}>
              {busy ? t("billing.resuming") : t("billing.resume")}
            </Button>
          }
        >
          {t("billing.canceled.body")}
        </Alert>
      )}

      <Card
        title={t("billing.plan.title")}
        action={
          <Button size="sm" variant="secondary" onClick={() => openPlanDialog(subscription)}>
            {t("billing.plan.change")}
          </Button>
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

      <Card
        title={t("billing.payment.title")}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setCardError(null);
              setCardDraft({ number: "", expiry: "", holder: payment?.holder ?? "" });
            }}
          >
            {payment ? t("billing.payment.update") : t("billing.payment.add")}
          </Button>
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

      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
        {t("team.backendNote")}
      </span>

      <Dialog
        open={planDraft !== null}
        title={t("billing.dialog.planTitle")}
        subtitle={t("billing.dialog.planSubtitle")}
        width={560}
        onClose={busy ? undefined : () => setPlanDraft(null)}
        footer={
          <>
            <Button variant="ghost" disabled={busy} onClick={() => setPlanDraft(null)}>
              {t("billing.close")}
            </Button>
            <Button variant="primary" disabled={busy || !draftValid} onClick={savePlan}>
              {busy ? t("billing.saving") : t("billing.save")}
            </Button>
          </>
        }
      >
        {planDraft && draftLimits && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {planError && <Alert tone="critical">{planError}</Alert>}

            <RadioGroup
              name="plan"
              value={planDraft.plan}
              onChange={(value: string) =>
                setPlanDraft({ ...planDraft, plan: value as PlanId })
              }
              options={plans.map((plan) => ({
                value: plan.id,
                label: `${t(PLAN_NAME[plan.id])} — ${t("billing.perSeatMonth", {
                  amount: formatMoney(
                    seatPriceMinor(plan.id, planDraft.cycle),
                    subscription.currency,
                    locale,
                  ),
                })}`,
                description: t(PLAN_TAGLINE[plan.id]),
              }))}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Switch
                checked={planDraft.cycle === "annual"}
                label={t("billing.cycle.switch")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPlanDraft({ ...planDraft, cycle: e.target.checked ? "annual" : "monthly" })
                }
              />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
                {t("billing.cycle.switchHint")}
              </span>
            </div>

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
              style={{ maxWidth: 160 }}
            />

            {draftValid && (
              <div
                style={{
                  background: "var(--primary-tint)",
                  border: "1px solid var(--primary-border)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 12px",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-primary)",
                }}
              >
                {t("billing.dialog.summary", {
                  seats: draftSeats,
                  perSeat: formatMoney(draftPerSeat, subscription.currency, locale),
                  total: t(
                    planDraft.cycle === "annual" ? "billing.total.annual" : "billing.total.monthly",
                    {
                      amount: formatMoney(
                        periodAmountMinor(planDraft.plan, planDraft.cycle, draftSeats),
                        subscription.currency,
                        locale,
                      ),
                    },
                  ),
                })}
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={cardDraft !== null}
        title={t("billing.payment.dialogTitle")}
        width={460}
        onClose={busy ? undefined : () => setCardDraft(null)}
        footer={
          <>
            <Button variant="ghost" disabled={busy} onClick={() => setCardDraft(null)}>
              {t("billing.close")}
            </Button>
            <Button variant="primary" disabled={busy} onClick={saveCard}>
              {busy ? t("billing.saving") : t("billing.save")}
            </Button>
          </>
        }
      >
        {cardDraft && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cardError && <Alert tone="critical">{cardError}</Alert>}
            <Input
              label={t("billing.payment.number")}
              mono
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={cardDraft.number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCardDraft({ ...cardDraft, number: e.target.value })
              }
            />
            <div style={{ display: "flex", gap: 12 }}>
              <Input
                label={t("billing.payment.expiry")}
                mono
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="04/29"
                value={cardDraft.expiry}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCardDraft({ ...cardDraft, expiry: e.target.value })
                }
                style={{ maxWidth: 120 }}
              />
              <Input
                label={t("billing.payment.holder")}
                autoComplete="cc-name"
                value={cardDraft.holder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCardDraft({ ...cardDraft, holder: e.target.value })
                }
                style={{ flex: 1 }}
              />
            </div>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {t("billing.payment.notice")}
            </span>
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
        open={cancelOpen}
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
        <span style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
          {t("billing.cancel.body", { date: formatDate(subscription.renews_at, locale) })}
        </span>
      </Dialog>
    </div>
  );
}
