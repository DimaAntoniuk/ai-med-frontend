Chat bubbles for the MedAI assistant; assistant messages carry badge + confidence, `footer` holds sources/ReviewBar.

```jsx
<AIMessage role="user">Summarize this patient's renal function.</AIMessage>
<AIMessage confidence="high" time="09:41" footer={<SourceRow index={1} source="Lab panel" time="07-12" />}>
  eGFR declined 18% over 3 months <CitationChip index={1} source="Lab panel 2026-07-12" />.
</AIMessage>
```
