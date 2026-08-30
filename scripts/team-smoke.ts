/**
 * Smoke test for the team subscription surface. Run: npx tsx scripts/team-smoke.ts
 *
 * Three things it guards:
 *  - the seat rules that tie membership to the subscription (invite, suspend,
 *    reactivate, seat floor) and the owner protection,
 *  - the validation the billing dialogs surface as localized errors,
 *  - the en/uk dictionaries: every key present, non-empty, and carrying the
 *    same {placeholders}, so a translated string never drops an interpolation.
 *
 * The screens are SSR-rendered too — outside the settings provider they fall
 * back to the English dictionary, which is enough to catch a broken render.
 */
import { createElement } from "react";
import { renderToString } from "react-dom/server";
// The offline stand-in, deliberately: the live client speaks HTTP to a running
// backend, which a smoke test has no business needing. The rules asserted below
// are the stand-in's copy of the backend's — see `src/api/teamFixtures.ts`.
import { fixtureTeamApi as teamApi } from "../src/api/teamFixtures";
import {
  TeamApiError,
  hasWorkspace,
  ownsBilling,
  type BillingProbeDto,
  type MemberRole,
} from "../src/api/teamTypes";
import { BillingScreen } from "../src/app/BillingScreen";
import { TeamScreen } from "../src/app/TeamScreen";
import { en, uk, type MessageKey } from "../src/i18n/strings";

let failures = 0;

function pass(label: string) {
  console.log(`ok   ${label}`);
}

function fail(label: string, detail: unknown) {
  failures += 1;
  console.error(`FAIL ${label}: ${detail}`);
}

function check(label: string, condition: boolean, detail = "") {
  if (condition) pass(label);
  else fail(label, detail || "assertion failed");
}

/** Asserts the call is rejected with a specific message key. */
async function rejects(label: string, key: MessageKey, run: () => Promise<unknown>) {
  try {
    await run();
    fail(label, `expected rejection with "${key}"`);
  } catch (error) {
    if (error instanceof TeamApiError && error.key === key) pass(label);
    else fail(label, `expected "${key}", got ${String(error)}`);
  }
}

async function seatRules() {
  const start = (await teamApi.getSubscription())!;
  check(
    "seats: a suspended member does not hold a seat",
    start.seats_used === 5 && start.seats_total === 6,
    `used=${start.seats_used} total=${start.seats_total}`,
  );
  check(
    "seats: the period charge is seats × per-seat price",
    start.amount_minor === 6 * 59000,
    `amount=${start.amount_minor}`,
  );

  await rejects("invite: rejects a malformed address", "team.error.badEmail", () =>
    teamApi.inviteMember("not-an-email", "clinician"),
  );
  await rejects("invite: rejects an address already on the team", "team.error.duplicate", () =>
    teamApi.inviteMember("OLENA.KOVALCHUK@clinic.example", "clinician"),
  );

  const invited = await teamApi.inviteMember("nova.likarka@clinic.example", "clinician");
  check("invite: the new member starts as invited", invited.status === "invited", invited.status);

  const afterInvite = (await teamApi.getSubscription())!;
  check(
    "invite: an outstanding invitation consumes a seat",
    afterInvite.seats_used === 6,
    `used=${afterInvite.seats_used}`,
  );

  await rejects("invite: refuses once every seat is taken", "team.error.noSeats", () =>
    teamApi.inviteMember("another@clinic.example", "clinician"),
  );
  await rejects("reactivate: needs a free seat to take back", "team.error.noSeats", () =>
    teamApi.setMemberStatus("m-6", "active"),
  );

  await rejects("owner: the last active owner cannot be removed", "team.error.lastOwner", () =>
    teamApi.removeMember("m-1"),
  );
  await rejects("owner: the last active owner cannot be demoted", "team.error.lastOwner", () =>
    teamApi.updateMemberRole("m-1", "admin"),
  );
  await rejects("owner: the owner cannot be suspended", "team.error.ownerSuspend", () =>
    teamApi.setMemberStatus("m-1", "suspended"),
  );
  await rejects("invite: resending only applies to open invitations", "team.error.notInvited", () =>
    teamApi.resendInvite("m-2"),
  );

  await teamApi.setMemberStatus("m-4", "suspended");
  const afterSuspend = (await teamApi.getSubscription())!;
  check(
    "suspend: frees the seat the member held",
    afterSuspend.seats_used === 5,
    `used=${afterSuspend.seats_used}`,
  );
  await teamApi.setMemberStatus("m-4", "active");
}

async function subscriptionRules() {
  await rejects("plan: seats cannot drop below the seats in use", "billing.error.seatsBelowUsed", () =>
    teamApi.changeSubscription({ plan: "team", cycle: "monthly", seats: 3 }),
  );
  await rejects("plan: rejects a seat count above the plan ceiling", "billing.error.maxSeats", () =>
    teamApi.changeSubscription({ plan: "solo", cycle: "monthly", seats: 6 }),
  );
  await rejects("plan: rejects a seat count below the plan floor", "billing.error.minSeats", () =>
    teamApi.changeSubscription({ plan: "clinic", cycle: "monthly", seats: 6 }),
  );
  await rejects("plan: rejects a fractional seat count", "billing.error.seatsInteger", () =>
    teamApi.changeSubscription({ plan: "team", cycle: "monthly", seats: 6.5 }),
  );

  const annual = await teamApi.changeSubscription({ plan: "team", cycle: "annual", seats: 8 });
  check(
    "plan: the annual cycle bills twelve months up front",
    annual.amount_minor === 49000 * 8 * 12,
    `amount=${annual.amount_minor}`,
  );

  const canceled = await teamApi.setCancelAtPeriodEnd(true);
  check(
    "cancel: is deferred to the end of the paid period",
    canceled.cancel_at_period_end && canceled.status === "canceled",
    canceled.status,
  );
  const resumed = await teamApi.setCancelAtPeriodEnd(false);
  check(
    "cancel: resuming restores the active subscription",
    !resumed.cancel_at_period_end && resumed.status === "active",
    resumed.status,
  );
}

async function billingDetailRules() {
  // The card is the payment provider's to collect: no PAN is ever posted here,
  // so there is no card validation to test — only that the app asks for a
  // hosted page and has somewhere to send the reader.
  await rejects("card: the offline stand-in has no hosted page to open", "billing.error.fixtureCard", () =>
    teamApi.startPaymentMethodUpdate(),
  );

  const card = await teamApi.getPaymentMethod();
  check(
    "card: only the brand and the last four digits are held frontend-side",
    card !== null && card.brand === "visa" && card.last4 === "4242",
    JSON.stringify(card),
  );

  await rejects("profile: rejects a company code of the wrong length", "billing.error.taxId", () =>
    teamApi.updateBillingProfile({
      company: "ТОВ Тест",
      tax_id: "123",
      email: "buh@clinic.example",
      address: "Київ",
    }),
  );
  await rejects("profile: rejects a malformed billing email", "billing.error.email", () =>
    teamApi.updateBillingProfile({
      company: "ТОВ Тест",
      tax_id: "42731905",
      email: "buh@",
      address: "Київ",
    }),
  );
  await rejects("profile: rejects an empty legal entity", "billing.error.company", () =>
    teamApi.updateBillingProfile({
      company: "   ",
      tax_id: "42731905",
      email: "buh@clinic.example",
      address: "Київ",
    }),
  );

  const invoices = await teamApi.listInvoices();
  check("invoices: history is returned newest first", invoices[0]?.number === "INV-2026-0008");
}

/**
 * A doctor signing up alone owns the workspace their first purchase creates:
 * checkout provisions it with them as owner. The probe may say that outright —
 * "owner" with nothing bought — or, on a backend that predates saying so, carry
 * no role at all. Both mean the same thing, and reading either as "someone else
 * owns this" leaves a solo doctor on a locked screen with no way to pay.
 */
async function soloOwnerRules() {
  const nothingBought = (role: MemberRole | ""): BillingProbeDto => ({
    available: true,
    subscribed: false,
    role,
    subscription: null,
  });
  const inWorkspace = async (role: MemberRole): Promise<BillingProbeDto> => ({
    available: true,
    subscribed: true,
    role,
    subscription: await teamApi.getSubscription(),
  });

  check("solo: a doctor with no workspace may buy one", ownsBilling(nothingBought("owner")));
  check("solo: the same when the backend states no role", ownsBilling(nothingBought("")));
  check("solo: there is no roster to ask for yet", !hasWorkspace(nothingBought("owner")));
  check("solo: a clinician in a workspace still may not buy", !ownsBilling(await inWorkspace("clinician")));
  check("solo: an admin in a workspace still may not buy", !ownsBilling(await inWorkspace("admin")));
  check("solo: a workspace with a subscription reads as one", hasWorkspace(await inWorkspace("owner")));
}

/** Every {placeholder} an English string interpolates must survive translation. */
function placeholders(text: string): string[] {
  return (text.match(/\{[a-zA-Z]+\}/g) ?? []).sort();
}

function dictionaries() {
  const keys = Object.keys(en) as MessageKey[];
  const empty = keys.filter((key) => !uk[key]?.trim());
  check("i18n: every English key has a Ukrainian string", empty.length === 0, empty.join(", "));

  const drifted = keys.filter(
    (key) => placeholders(en[key]).join() !== placeholders(uk[key]).join(),
  );
  check(
    "i18n: placeholders match across both dictionaries",
    drifted.length === 0,
    drifted.join(", "),
  );
  console.log(`     ${keys.length} message keys checked`);
}

function screens() {
  for (const [label, element] of [
    ["TeamScreen", createElement(TeamScreen, { currentEmail: null, onManageSeats: () => {} })],
    ["BillingScreen", createElement(BillingScreen, {})],
  ] as const) {
    try {
      const html = renderToString(element);
      if (!html) throw new Error("empty render");
      pass(`render: ${label} renders outside the settings provider`);
    } catch (error) {
      fail(`render: ${label}`, error);
    }
  }
}

async function main() {
  dictionaries();
  screens();
  await soloOwnerRules();
  await seatRules();
  await subscriptionRules();
  await billingDetailRules();

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll team subscription checks passed.");
}

main();
