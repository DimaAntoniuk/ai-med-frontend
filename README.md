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
└── app/             # ConsultationScreen (intake → review gate → run), useRun (SSE), TraceView
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

## Verification

- `npm run build` — type-check (`tsc -b`) + production bundle
- `npx tsx scripts/widget-smoke.ts` — SSR-renders every widget with realistic,
  malformed, and empty payloads (block payloads are LLM-generated and unvalidated
  server-side, so widgets must never trust the shape)

## Streaming notes (matches the backend contract)

- SSE endpoint `GET /runs/{id}/events`, always event name `ai.event`; the discriminator is
  the JSON `type` field. `block_ready` carries only `kind` + `block_id` — payloads are
  fetched from `GET /runs/{id}` (Postgres is the source of truth).
- Replay restarts `seq` at 0 — dedupe by `block_id`, never by `seq`.
- The server closes the stream after `run_completed`/`run_failed`; the client must close
  the `EventSource` then, or the browser would reconnect forever.
- An `interrupted` run surfaces on replay as `run_failed` with
  `error: "run interrupted by restart"`.
