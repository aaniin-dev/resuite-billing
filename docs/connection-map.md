# RESUITE — Connection Map

How a tap in the app becomes a spreadsheet row and a filled form. Every path is
joined by **number** — names and content live only in the Decoder.

## Field paths

| App payload field        | Tracker column            | Doc token                          | Decoder join              |
|--------------------------|---------------------------|------------------------------------|---------------------------|
| `type:"time".clientNumber` | TimeLog.Client Number    | `{{SHEET_NUMBER}}` / `{{CLIENT_NAME}}` | Clients by Client Number |
| `type:"time".date`         | TimeLog.Date             | `{{DATE}}`                          | —                         |
| `type:"time".start`        | TimeLog.Start            | `{{START}}`                         | —                         |
| `type:"time".stop`         | TimeLog.Stop             | `{{STOP}}` / `{{TOTAL_HM}}`         | —                         |
| `type:"time".minutes`      | TimeLog.Minutes          | `{{TOTAL_HM}}`                      | —                         |
| `type:"time".points`       | TimeLog.Points           | `{{BILLABLE_POINTS}}`               | —                         |
| `type:"meeting".time`      | Meetings.Time            | `{{NEXT_MEETING_TIME}}`             | —                         |
| `type:"meeting".date`      | Meetings.Date            | `{{NEXT_MEETING_DATE}}`             | —                         |
| (location)                 | (none — app never sends) | `{{LOCATION}}`                      | Clients by Client Number  |
| `type:"deadline".kind`     | Deadlines.Kind Code      | —                                  | Kinds by Kind Code        |
| `type:"task".category`     | Tasks.Category Code      | —                                  | Categories by Category Code |
| `type:"step".stepId`       | FollowUp.Step Number     | —                                  | Steps by Step Number      |

## JSON the app POSTs (or that the CSV columns represent), per type

```
time:     { type, clientNumber, date, start, stop, minutes, points }
meeting:  { type, clientNumber, date, time }
deadline: { type, clientNumber, date, kind }
task:     { type, clientNumber, date, time, category }
step:     { type, clientNumber, stepId, done, date, time }
```

## Rules

- Anonymous numbers only on app-facing artifacts; labels only in the Decoder.
- Billing formula verbatim: `ROUNDUP(minutes/6, 0) / 10` — never ROUND/MROUND.
- Append-only — every send is its own row; never overwrite or de-duplicate.
- One-way — nothing is ever sent back to the app.
- Firm-side billing: `Amount = TimeLog Points × Clients[Hourly Rate]`, by Client Number.
