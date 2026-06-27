# RESUITE — Anonymous Legal Time Tracking

A single-page, mobile-first time tracker for law firms. It transmits **only** a
client number, dates, times, and numbers — never names or content. Every human-
readable label lives firm-side and is joined back in by number.

## Live app

The app is a static site (`index.html`). Deploy to Vercel as a static project —
no build step required.

## Billing rule

Every started 6-minute unit = 0.1 hr, always rounded **up** (`ROUNDUP(min/6,0)/10`).
1–6 min = 0.1, 7–12 = 0.2, … 55–60 = 1.0, then +0.1 per unit.

## Connecting to Microsoft 365 (Copilot / Power Automate)

The app POSTs each time entry as JSON to a write-only webhook URL:

```json
{ "type":"time", "clientNumber":"428193", "date":"2026-06-27",
  "start":"14:15", "stop":"14:48", "minutes":33, "points":0.6 }
```

To wire it up:

1. Paste [`docs/copilot-prompt.md`](docs/copilot-prompt.md) into Microsoft 365
   Copilot (with Power Automate / Copilot Studio access). It builds the
   **RESUITE Hours Log** workbook + a "When an HTTP request is received" flow and
   returns a **POST URL**.
2. In the app, tap **⚙ Connect spreadsheet** and paste that URL.
3. Create a client number, add a time entry, tap **Add & Send** — a row lands in
   the `TimeLog` table within seconds.

See [`docs/roadmap.md`](docs/roadmap.md) for the follow-on features (meetings,
deadlines, tasks, reminders) and [`docs/resuite-datasets-prompt.md`](docs/resuite-datasets-prompt.md)
for the full data layer (decoder tables, document template, connection map).

## Privacy contract

| Travels off the phone | Stays firm-side |
|---|---|
| Client number, dates, times, minutes, points, number codes, yes/no | Client names, matter descriptions, locations, what each code means |

One-way only: the app POSTs and can never read anything back.
