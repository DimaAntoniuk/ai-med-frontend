# ai-med-frontend

React frontend for the **ai-med-agent** POC (`../ai-med-agent`), built on the MedAI
healthcare design system (`design-system-src/`, unpacked from "Healthcare UI design
patterns.zip").

The flow mirrors the backend's trust loop: paste or record a consultation transcript →
doctor reviews and **approves** (nothing reaches the LLM before that) → agent run streams
result blocks over SSE → differential / gap analysis / treatment render as widgets with
citations, dual confidence, and a clinician review gate → the audit trail renders the
persisted trace.

## Lego-block widget system

The agent controls the UI. Every block the backend emits (`present` tool → `block_ready`
on the `ai.event` stream) is a `WidgetDescriptor { type, payload, id }` rendered through a
registry (`src/widgets/registry.tsx`):

- `differential`, `gap_analysis`, `treatment` — clinical widgets (`src/widgets/clinical.tsx`)
- `text`, `key_value`, `table`, `alert` — generic widgets the agent can adopt without
  frontend changes (`src/widgets/generic.tsx`)
- anything else falls back to a raw-JSON card, so an unknown block never breaks the stream

To add a lego block: create a component taking `WidgetProps` and register it in
`src/widgets/index.ts`.

## Layout

```
src/
├── design/          # MedAI design system: tokens (CSS) + components (.jsx + .d.ts, ported as-is)
├── api/             # wire contract types + fetch client (client.ts, types.ts)
├── widgets/         # the lego-block registry + clinical/generic widgets
└── app/             # ConsultationScreen (intake → review gate → run), useRun (SSE), TraceView,
                     # TeamScreen + BillingScreen (team subscription)
```

## Run

Backend first (see `../ai-med-agent/README.md`): db + sandbox via docker compose, API on
`:8000`, KB seeded. Then:

```sh
npm install
npm run dev        # http://localhost:5173 — calls the backend at :8000 directly
```

`VITE_API_BASE` overrides the backend base URL (default `http://localhost:8000`). The
backend allows the dev-server origin via its `CORS_ORIGINS` setting (default
`http://localhost:5173`). A Vite dev proxy was tried first but stalls SSE responses, so
the browser talks to the API directly.

## Auth

The backend gates every clinical route behind a passwordless email OTP → HTTP-only
session cookie (`AUTH_ENABLED=false` disarms the gate). The app probes the session on
load, shows the sign-in screen when anonymous, and swaps back to it whenever any call
answers 401. All requests carry `credentials: "include"`; the `EventSource` uses
`withCredentials`. Without SMTP configured (`SMTP_HOST` empty) the backend logs the
one-time code in the api process log — grep for `OTP for`.

`GET /auth/methods` decides what the sign-in screen offers. Where the backend has
WorkOS credentials it answers `sso: true` and the screen adds **Continue with single
sign-on**, which *navigates* to `/auth/sso/start` — a fetch is wrong there and fails
confusingly (the response redirects to workos.com, and the short-lived state cookie
would ride on an XHR the browser discards). WorkOS returns the browser to the app
either cleanly or with `?login_error=`, which the screen translates and then strips
from the URL. `restricted: true` says the deployment is corporate-login-only, and the
screen says so before the doctor types — an outside address gets the same 202 with no
code, otherwise indistinguishable from a lost email. Signing out follows
`sign_out_url` when the provider returns one; skipping that navigation would let the
next person at a shared workstation back in as the doctor who just left.

After the first sign-in the app asks for a **name and clinical role** and keeps them
in this browser, keyed to the account (`src/api/profile.ts`); Settings edits them.
The backend stores neither today — `GET /auth/me` answers email, subject and expiry —
so that module is the single seam to swap when a profile route lands. The clinical
role is for wording and defaults only; what a doctor may *do* is the team role an
owner assigned, which the API decides on every request.

## Team subscription

**Team** and **Billing** in the sidebar manage a shared workspace: who holds a seat, what
they may do, and what the practice pays for it.

The seat count is the hinge between the two screens. A member counts against it while they
are active *or* while their invitation is outstanding; suspending a member keeps their
history but frees the seat. Inviting past the limit is refused with a localized reason and
a link into the plan dialog, rather than failing silently — and the plan dialog refuses to
drop the seat count below the seats already in use.

A doctor signing up alone is the owner of the workspace their first purchase creates:
`GET /billing` answers `role: "owner"` with no subscription, and the two screens read a
probe carrying no `subscription` as *no workspace yet* — the plan dialog is offered, the
roster, card and invoices are not asked for, because those routes 403 until checkout
creates them. `ownsBilling()` in `src/api/teamTypes.ts` also treats a blank role there
as the same thing, so the purchase path works against a backend that predates that
answer; without it a solo doctor sees "ask your workspace owner" and cannot pay.

The first two months are free, and wanting to pay is never the hard path. The probe's
`trial_days` is how long this doctor's *next* purchase would run free — 0 where the
deployment sells no trial and 0 once the workspace has bought anything, so the offer is
never advertised twice. Checkout still takes the card, so a trialing workspace is fully
unlocked, reads as `active`, and carries `trial_ends_at` — the date of the first charge,
which the subscription card shows in place of the renewal date. An owner who would rather
start now presses **Start paying now** on the trial banner: `POST /billing/trial/end`
charges the card on file today and returns the same plan and seat count. It is not a
cancellation and not a second purchase, and there is no flow here that pretends otherwise.

Roles are `owner` (subscription and billing included), `admin` (members and invitations,
no billing) and `clinician` (neither). The workspace always keeps at least one active
owner: the last one cannot be demoted, suspended, or removed. Only an owner may mint
another owner, so the role select and the invite dialog drop that option for admins.

`src/api/team.ts` is the live HTTP client for the backend contract in
`../ai-med-agent/docs/fe-billing.md`. Rejections arrive as `{"detail": "<message key>",
"params": {…}}`, so screens localize the reason instead of printing a server sentence.
`src/api/teamFixtures.ts` keeps the old in-memory stand-in for opening the screens on a
laptop with no payment provider configured — it is off unless `VITE_TEAM_FIXTURES=1`, and
nothing should be demoed or accepted against it.

A plan the backend does not list is unpriced, and for `clinic` that is the intended
state: it is sold by a conversation, so the plan dialog renders it as a non-selectable
card reading *Let's talk* with a **Book a demo** button. The button appears only when
`VITE_CONTACT_SALES_URL` is set at build time (a compose variable of the same name) —
a dead link is worse than no link. Price the plan in Stripe and it becomes an ordinary
selectable card with no code change.

Three route shapes are worth knowing before reading the screens:

- **`GET /billing` is the probe**, and the one billing route that never 404s. It answers
  `available` (is billing configured at all), `subscribed`, the caller's `role`, and the
  subscription. Both screens load it first and ask for nothing their role cannot have —
  the card, invoices and billing profile are the owner's alone and 403 for anyone else.
- **`/billing/checkout/start` and `/billing/portal/start` are navigations**, not fetches.
  They answer 307 to a page on the provider's own domain, so an XHR is either blocked by
  CORS or silently handed HTML. The card number never reaches this app or the backend;
  `POST /billing/payment-method` returns a hosted URL to send the browser to.
- **402 is not 401.** Any clinical route may answer 402 when the workspace has no active
  subscription or the member is suspended. The client raises a `medai:payment-required`
  event, `App.tsx` switches to the billing screen, and the session is left untouched.

Returning from checkout with `?billing=success` means *paid*, not *provisioned* —
fulfilment is webhook-driven, so the billing screen polls the probe for a few seconds
before rendering the unlocked state.

Seats are bought, not grown: inviting past `seats_total` is refused rather than quietly
resizing the subscription, because buying a seat is the owner's decision. Prices are per
seat per month in minor units (kopiykas), UAH; the annual cycle bills twelve months up
front. Invoice headers carry the ЄДРПОУ/ІПН that Ukrainian legal entities need.

## Verification

- `npm run build` — type-check (`tsc -b`) + production bundle
- `npx tsx scripts/widget-smoke.ts` — SSR-renders every widget with realistic,
  malformed, and empty payloads (block payloads are LLM-generated and unvalidated
  server-side, so widgets must never trust the shape)
- `npx tsx scripts/team-smoke.ts` — exercises the seat/owner/billing rules against the
  offline stand-in in `src/api/teamFixtures.ts` (the live client speaks HTTP, which a
  smoke test has no business needing), SSR-renders both team screens, and checks that
  every English message key has a Ukrainian string with the same `{placeholders}`

## Streaming notes (matches the backend contract)

- SSE endpoint `GET /runs/{id}/events`, always event name `ai.event`; the discriminator is
  the JSON `type` field. `block_ready` carries only `kind` + `block_id` — payloads are
  fetched from `GET /runs/{id}` (Postgres is the source of truth).
- Replay restarts `seq` at 0 — dedupe by `block_id`, never by `seq`.
- The server closes the stream after `run_completed`/`run_failed`; the client must close
  the `EventSource` then, or the browser would reconnect forever.
- An `interrupted` run surfaces on replay as `run_failed` with
  `error: "run interrupted by restart"`.
