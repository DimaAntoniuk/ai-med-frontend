# MedAI POC — chat-first clinical assistant

Simplified proof-of-concept surface: one patient in context, a conversational thread with MedAI,
citations on every claim, confidence meters, and an approve-to-chart review bar. No sidebar, no tabs —
the minimum that demonstrates the trust loop (ask → cited answer → clinician sign-off).

Files: `index.html` (interactive mount), `ChatScreen.jsx`.
Interactions: send a message or click a suggestion chip → canned MedAI reply; approve/reject the drafted plan.
