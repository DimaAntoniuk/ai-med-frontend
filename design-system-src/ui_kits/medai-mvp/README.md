# MedAI MVP — clinical workspace + admin oversight

Mature-feature surface with two roles behind one top nav:

- **Doctor workspace** — patient look-up sidebar (search by name/MRN, acuity flags), patient header with
  allergies, vitals row with provenance, chart tabs (Overview / Medications / Labs), AI visit-prep card with
  citations + approve/reject, and a persistent MedAI copilot panel scoped to the open patient.
- **Admin oversight** — usage KPIs, review queue with per-item AI confidence and escalate/reviewed actions,
  audit trail of AI events, and model/data governance facts (EU AI Act / GDPR framing).

Files: `index.html` (role switcher mount), `DoctorWorkspace.jsx`, `AdminDashboard.jsx`.
Interactions: patient selection, chart tabs, approve/reject the AI summary, copilot chat shortcuts,
queue escalate/review, role switch.
