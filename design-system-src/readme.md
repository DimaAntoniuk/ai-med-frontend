# MedAI Design System

Design system for **MedAI** — a clinical AI agent for doctors (primary users) and clinic admins
(observers/oversight). Desktop-first (clinical workstations), balanced density, built for **high trust**
under EU AI Act / GDPR expectations.

## Sources & context
- UX pattern research extracted from Koru UX's "50 Healthcare UI examples"
  (https://www.koruux.com/50-examples-of-healthcare-UI/): MRN-aware patient look-up, record layouts with
  overview header + right-rail context, acuity color pills, severity-coded alerts, provenance on vitals
  (human vs device entry), role-based dashboards that highlight where intervention is needed.
- No brand assets were provided. **There is no logo** — the wordmark is plain type
  (Public Sans Bold, "AI" in the violet accent). Do not invent a mark.
- Product shape (from stakeholder answers): chat-first assistant + AI-insight dashboards + full clinical
  workspace; admins observe usage, outcomes, and a compliance review queue.

## Index
- `styles.css` — global entry; imports everything in `tokens/`.
- `tokens/` — colors, typography, spacing, elevation, fonts, base resets.
- `guidelines/` — foundation specimen cards (colors, type, spacing, elevation, AI-accent usage).
- `components/forms/` — Button, IconButton, Input (+Field), Select, Checkbox (+RadioGroup), Switch, Textarea.
- `components/data/` — Card, Table, Tabs, Badge (+Tag).
- `components/feedback/` — Alert, Dialog, Toast (+Tooltip).
- `components/healthcare/` — PatientHeader, PatientListItem, AcuityPill, VitalCard.
- `components/ai/` — AIBadge, AIMessage, CitationChip (+SourceRow), ConfidenceMeter, ReviewBar, AuditLogEntry.
- `components/cardkit.js` — loader used by specimen cards and UI kits (prefers the compiled bundle,
  falls back to transpiling sources).
- `ui_kits/medai-poc/` — simplified POC: chat-first assistant with citations + sign-off.
- `ui_kits/medai-mvp/` — MVP: doctor workspace (patient list, chart tabs, copilot panel) + admin oversight
  dashboard (KPIs, review queue, audit trail, governance).
- `SKILL.md` — agent-skill entry point.

## CONTENT FUNDAMENTALS
- Tone: calm, precise, clinical-professional. Sentence case everywhere (headings, buttons, labels).
  No exclamation marks, no marketing language, **no emoji**.
- Voice: second person for the user ("You are observing…"), third person for the AI ("MedAI drafted…").
  The AI is always named MedAI and never anthropomorphized beyond "drafted / suggested / found".
- AI copy must be falsifiable and sourced: state the finding, cite it, quantify it
  ("eGFR fell from 63 to 52 mL/min over 3 months [1]"), and say what to do next.
- Uncertainty is stated plainly: low confidence always reads "verify"; drafts read "Requires clinician review".
- Buttons are verb-first and specific: "Approve & sign", "Add to chart", "Export compliance report" —
  never "OK"/"Submit".
- Clinical identifiers (MRN, dosages, timestamps, event IDs, lab values) always render in mono.
- Regulatory posture is worn openly: footers and oversight banners reference logging and human oversight
  (EU AI Act Art. 13/14, GDPR Art. 9) in plain language.

## VISUAL FOUNDATIONS
- **Color tone**: cool slate neutrals (hue 264, chroma ≤ 0.02). Page bg `--surface-page` (near-white),
  cards pure white. Two accents, same lightness/chroma (oklch 0.50/0.16), different hue:
  indigo-blue `--primary` (262) = *human* actions/navigation; violet `--ai` (295) = *machine* output.
  **The violet accent is a trust signal, not decoration** — it may only mark AI-generated or AI-invoking UI.
- **Semantics**: success 155, warning 70–85, critical 27, info 240; each with tint + border pair.
  Acuity scale (low/moderate/high/critical) and confidence scale (high/medium/low) derive from these.
- **Type**: Public Sans (UI, 400–700) + IBM Plex Mono (identifiers/data). Scale 11 → 32px; overlines are
  11px semibold uppercase +0.06em. No serif, no display font.
- **Backgrounds**: flat solid surfaces only. No gradients, no textures, no imagery. Depth comes from
  soft slate-tinted layered shadows (`--shadow-xs…lg`; `--shadow-ai` is violet-tinted for AI surfaces).
- **Borders**: 1px `--border-subtle` on cards; 1.5px `--border-strong` on inputs; tinted borders pair with
  tinted fills on pills/alerts.
- **Radii**: 6 chips · 8 buttons/inputs · 12 cards/dialogs · 16 panels & chat bubbles · pill for badges.
  Chat bubbles use 16px with one 6px "anchor" corner (bottom-right for user, top-left for AI).
- **Hover**: darker fill for solid buttons, `--n-50/100` wash for ghost/rows. Press: one step darker.
  Focus: 3px soft ring (`--ring`, `--ring-ai`, `--ring-critical`), color follows context.
- **Motion**: utilitarian only — 100–150ms ease on background/box-shadow/transform; no bounces, no entrance
  animations. Clinical software should feel still.
- **Transparency/blur**: none, except the dialog scrim (slate at 45%).
- **Layout**: fixed top bar (54–56px), fixed side panels (sidebar ~290px, copilot ~360px), scrolling center.
  Balanced density: 12–16px card padding, 4px spacing scale.
- **Cards**: white, 12px radius, subtle border + `--shadow-sm`. AI cards swap to violet border + `--shadow-ai`.

## ICONOGRAPHY
- No icon assets were provided. The system uses **Lucide** (stroke icons, 1.5–2px weight) via the
  `lucide-static` icon-font CDN — classes like `icon-search`, `icon-ellipsis` (flagged substitution;
  swap in brand icons when they exist).
- Icons are always `currentColor`, 14–18px, functional-only (search, close, overflow). No decorative icons.
- The only drawn glyph is the 4-point spark in `AIBadge` (part of the AI-labeling pattern).
- Unicode used sparingly for data glyphs: trend arrows ↑ ↓ →, close ×, select caret ▾. **No emoji.**

## Trust patterns (the point of this system)
1. **Label** — every AI output carries `AIBadge` (violet) inline.
2. **Cite** — every AI claim carries `CitationChip` → `SourceRow` list.
3. **Qualify** — `ConfidenceMeter` (3 bars); low confidence always says "verify".
4. **Gate** — `ReviewBar` approve/edit/reject before anything enters the record; resolved state shows
   reviewer + timestamp.
5. **Log** — `AuditLogEntry` timeline renders the trail admins observe.

## Intentional additions
No component inventory was provided, so the core set (forms/data/feedback) is authored from scratch, and the
healthcare + AI families derive from the Koru article research and the stakeholder questionnaire.

## Caveats
- Fonts load from Google Fonts CDN (`tokens/fonts.css`) — no font binaries in-repo.
- Lucide is a placeholder icon set pending brand icons.
- Reminder: set the file type to **Design System** in the Share menu so others in the org can use it.
