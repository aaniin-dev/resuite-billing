# RESUITE — Roadmap (come back to this after the core integration works)

Build order rule: **don't add anything below until a time entry reliably lands in the TimeLog spreadsheet.** Each feature follows the same privacy contract — the app only ever sends **a client number, codes (numbers), yes/no, dates, and times.** No names, no content, no locations leave the phone. Copilot/the firm side maps every number/code to its real meaning.

Each feature = (1) a new entry `type` the app POSTs, (2) a branch in the intake flow, (3) optionally a new sheet. The app already tags every send with a `type` field, so the flow just needs a Switch on `type`.

---

## 1. Meetings (next meeting / booking)
- App sends: `{ "type":"meeting", "clientNumber":"428193", "date":"2026-06-27", "time":"15:30" }`
- Flow: add row to a **Meetings** sheet (Client Number, Date, Time, Logged At) → then create an Outlook calendar event. **Location and client name are added by Copilot from the firm system — never sent by the app.**

## 2. Deadlines
- App sends: `{ "type":"deadline", "clientNumber":"428193", "date":"2026-07-10", "kind":2 }`
  - `kind` is a number code (e.g. 1=filing, 2=response due, 3=signing). The app stores the code→label list **locally only**; only the number is sent.
- Flow: add row to a **Deadlines** sheet (Client Number, Due Date, Kind code, Logged At). Copilot maps the code to the real deadline type and can set Outlook reminders firm-side.

## 3. Tasks to pass on (to the admin)
- Generic hand-off, no detail. App sends: `{ "type":"task", "clientNumber":"428193", "date":"2026-06-27", "time":"11:05", "category":1 }`
  - `category` is a number code. Starter set: **1 = Documents, 2 = Emails, 3 = Other** — and the app lets the user **add their own categories** (each gets the next number; labels stay on the phone).
- Flow: add row to a **Tasks** sheet (Client Number, Date, Time, Category code, Logged At). The admin sees "Client #428193 — category Documents" and knows what to action, without the lawyer writing anything. Copilot maps the code to the label.

## 4. Daily follow-through (yes/no checklist)
- App sends per tick: `{ "type":"step", "clientNumber":"", "stepId":2, "done":true, "date":"...", "time":"..." }`
- Flow: add row to a **FollowUp** sheet (Date, Step Number, Done, Time, Logged At). Step wording is firm-side, mapped by Step Number.

## 5. Reminders (the app-side nudges we removed)
- "Are you still working?" check-in at 1h / 30m / 15m / 5m (reminder only, no time math).
- Checkpoint "did you do this?" nudges through the day.
- Note: a web app can only pop these while it's open. For reliable reminders when the phone is locked, let **Copilot send them** (Outlook/Teams) on a Recurrence trigger reading the FollowUp/Tasks/Deadlines sheets.

## 6. End-of-day rollup (admin enablement)
- Copilot Recurrence flow (e.g., 18:00): compile today's TimeLog totals per Client Number, plus any Meetings/Deadlines/Tasks, and email the **admin** a one-screen summary. The lawyer never has to message anyone — the admin acts off the sheet.

## 7. Security: lock the endpoint
- Add a secret `token` to every send; the flow rejects anything whose token doesn't match. Keeps the write-only URL from accepting rows from anyone who finds it. (On the Vercel backend this is trivial — store the token as an env var.)

---

### Privacy cheat-sheet (applies to every feature)
| Travels off the phone | Stays on the phone / lives firm-side |
|---|---|
| Client number, dates, times, minutes, points | Client names, matter descriptions |
| Step / kind / category **number codes**, yes/no | What each code actually means (the labels) |
| (nothing else) | Locations, emails, documents, any free text |

If a feature would require sending words, stop — encode it as a number code and map it on the Copilot side instead.
