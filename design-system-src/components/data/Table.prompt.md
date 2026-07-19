Data table; mark identifier/date columns `mono: true`; pass `render` for pills.

```jsx
<Table onRowClick={open} columns={[{key:"name",label:"Patient"},{key:"mrn",label:"MRN",mono:true},{key:"acuity",label:"Acuity",render:r=><AcuityPill level={r.acuity}/>}]} rows={patients} />
```
