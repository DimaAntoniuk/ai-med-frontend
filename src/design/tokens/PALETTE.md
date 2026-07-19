# Clinical palette — Ukrainian clinician direction

**Status: research-grounded starting hypothesis, NOT clinician-validated.** No credible
published study directly asks Ukrainian doctors which software palette they prefer.
This palette follows the available human-factors evidence for clinical interfaces:
white + cool neutrals dominate, restrained blue is the interaction colour, and
saturated colour is reserved for navigation, status, and risk communication.

## Roles

| Role | Colour | Hex | Token | Use |
|---|---|---|---|---|
| Primary | Clinical blue | `#1769AA` | `--primary` | Main actions, active navigation, links |
| Primary dark | Deep navy | `#123B5D` | `--primary-dark` | Headings, selected states, sidebar, inverse surfaces |
| Primary light | Pale blue | `#EAF4FA` | `--primary-tint` | Selected rows, information panels |
| Background | Cool white | `#F8FAFC` | `--surface-page` / `--n-50` | Main application background |
| Surface | White | `#FFFFFF` | `--surface-card` | Cards, forms, patient records |
| Border | Cool grey | `#D8E1E8` | `--border-subtle` / `--n-200` | Dividers, inputs, table borders |
| Main text | Charcoal navy | `#172B3A` | `--text-primary` / `--n-900` | Primary text |
| Secondary text | Slate | `#536875` | `--text-secondary` / `--n-600` | Metadata, supporting information |
| Success | Medical green | `#27845B` | `--success` | Completed, confirmed, stable |
| Warning | Amber | `#B86E00` | `--warning` | Attention required, pending review |
| Critical | Deep red | `#B4232F` | `--critical` | Errors, allergies, dangerous results |
| Informational | Cyan-blue | `#087E8B` | `--info` | Neutral system information |

The violet AI accent (`--ai`) is outside this spec: it is the AI trust signal
(label / cite / qualify / gate) and marks machine output only — never brand.

## Usage rules

- Green is never the brand colour — clinicians read it as "normal / completed".
- Red is never an ordinary button or accent — reserve it for genuinely critical information.
- Never communicate medical status through colour alone: pair with an icon and explicit
  text — in the Ukrainian UI: «Критично», «Потребує уваги», «Підтверджено».
- No large areas of saturated blue, cyan, or green — clinicians live in this UI for
  hours; the dominant environment stays neutral.
- No pale grey body text, no coloured table text, no gradients — clinical tables need
  stable contrast and predictable hierarchy.

## Dark mode

Tokens follow the OS colour scheme via `prefers-color-scheme` (no in-app toggle) —
`color-scheme: light dark` is set so native controls follow too. Dark keeps the same
roles on deep navy surfaces (`#0F1924` page / `#16232F` card) with the neutral ramp
inverted and accents lifted for contrast (primary `#4A97D2`, critical `#D5626C`,
success `#4DB286`, warning `#D39336`, info `#45A8B4`).

## Contrast audit (WCAG 2.1)

- Body text: 13.9–14.6:1 light, 14.4–16:1 dark (AAA). Secondary text ≥5.8 light / 7.6
  dark (AA+). Links/primary text ≥5:1 both themes.
- Status text on tints: 3.6–5.6 light (AA-large to AA), 4.6–6:1 dark (AA) — status
  pills are semibold labels and are never the sole carrier of meaning (icon + text rule).
- Solid button labels: white on blue/red is 5.8–6.5:1 light; ~3.2–3.6:1 dark. The dark
  values are the best a shared token permits (one colour serves as both button fill and
  text accent); revisit if clinician testing flags it.

## Validation before final approval

Moderated testing with ~12–18 Ukrainian clinicians (primary-care physicians,
specialists, nurses/medical administrators) across three realistic variants:

1. Blue + neutral (this palette)
2. Teal + neutral
3. Navy with a restrained Ukrainian blue accent

Tasks: find an abnormal lab result, open a patient record, prescribe medication,
recognize an allergy warning. Measure task completion, errors, time, perceived trust,
eye comfort, and colour comprehension. Only after that testing does this palette
graduate from hypothesis to the final colour system.
