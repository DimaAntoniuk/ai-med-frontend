Checkbox and RadioGroup with optional per-option descriptions.

```jsx
<Checkbox label="Include discontinued medications" checked onChange={fn} />
<RadioGroup name="scope" value="30d" onChange={fn} options={[{value:"30d",label:"Last 30 days"},{value:"all",label:"Full history"}]} />
```
