# RESUITE — Copilot Backend Automations Prompt

Paste the block below into **Microsoft 365 Copilot** (with Copilot Studio /
Power Automate access) in the tenant that holds the **RESUITE Hours Log**
workbook. It assumes data arrives by **manual import** today — the RESUITE app
exports a CSV, you import those rows into the `TimeLog` table — and it sets up
every backend automation that runs off that workbook. It is written so the same
flows keep working unchanged if a live HTTP/Graph feed is added later.

---

```
You are setting up the backend automation layer for an anonymous legal
time-tracking system called RESUITE. The data already lives in an Excel workbook
called "RESUITE Hours Log" in this tenant (OneDrive/SharePoint). Time rows arrive
by manual CSV import into the Excel table named TimeLog. A separate,
access-restricted workbook called "RESUITE Decoder" holds the human meaning.
Build everything below. Do not invent fields, do not change the billing formula,
and never copy client names or free text onto anything the app touches.

PRIVACY CONTRACT (applies to everything):
- App-facing data is NUMBERS ONLY: client number, dates, times, minutes, points,
  number codes (kind/category/step), yes/no.
- Human meaning (client names, rates, matters, locations, task wording) lives
  ONLY in RESUITE Decoder and is joined in by number. Never write names/content
  back into TimeLog or anything the app reads.
- One-way: never build anything that sends data back to the app.

== WORKBOOK SHAPE (confirm / create to match) ==
Workbook "RESUITE Hours Log" with Excel tables:
  TimeLog:   Client Number(text) | Date | Start(HH:MM) | Stop(HH:MM) | Minutes(int)
             | Points(number) | Logged At(datetime) | Points Check
  Meetings:  Client Number | Date | Time(HH:MM) | Logged At
  Deadlines: Client Number | Due Date | Kind Code(int) | Logged At
  Tasks:     Client Number | Date | Time(HH:MM) | Category Code(int) | Logged At
  FollowUp:  Date | Step Number(int) | Done(yes/no) | Time(HH:MM) | Logged At
  Summary sheet (per unique Client Number): Total Points, Total Minutes, Entry Count.
Workbook "RESUITE Decoder" (firm-only) with tables:
  Clients:    Client Number | Client Name | Matter/Sheet # | Hourly Rate | Location
  Steps:      Step Number | Task Wording
  Kinds:      Kind Code | Deadline Type
  Categories: Category Code | Task Category

== BILLING RULE (verbatim, non-negotiable) ==
Every started 6-minute unit = 0.1 hr, rounded UP. Points Check column =
ROUNDUP([@Minutes]/6,0)/10 and must equal Points on every row. Use ROUNDUP only,
never ROUND/MROUND. Conditional-format any row red where Points Check <> Points.

== AUTOMATION 1 — VALIDATE ON IMPORT ==
Flow "RESUITE Validate" (trigger: when a row is added or modified in TimeLog, or
a manual/scheduled run after each import): for every TimeLog row, recompute
ROUNDUP(Minutes/6,0)/10 and flag any row where it does not equal Points. Post the
list of bad rows (Client Number + Date + the two values) to the firm's review
channel/email. Do not auto-edit Points — only flag.

== AUTOMATION 2 — REFRESH SUMMARY ==
Keep the Summary sheet current per unique Client Number:
  Total Points  = SUMIF(TimeLog[Client Number], <client>, TimeLog[Points])
  Total Minutes = SUMIF(TimeLog[Client Number], <client>, TimeLog[Minutes])
  Entry Count   = COUNTIF(TimeLog[Client Number], <client>)
Do NOT put dollars here; rates live in the Decoder.

== AUTOMATION 3 — FIRM-SIDE BILLING ROLLUP ==
Flow/table that joins Summary to RESUITE Decoder by Client Number and computes
  Amount = Total Points × Clients[Hourly Rate]
producing a billing view: Client Number | Client Name (from Decoder) | Total
Points | Hourly Rate | Amount. Keep this in the Decoder workbook or a firm-only
sheet — never anywhere the app can read.

== AUTOMATION 4 — MEETING FOLLOW-UP DOCUMENT ==
When a Meetings row is added (or on demand for a Client Number), generate a Word
doc from the "Meeting Follow Up Form" template by filling the {{tokens}}:
  {{SHEET_NUMBER}}/{{CLIENT_NAME}} <- Decoder.Clients by Client Number
  {{DATE}} {{START}} {{STOP}}       <- that client's latest TimeLog row
  {{TOTAL_HM}}                       <- Minutes as h:mm
  {{BILLABLE_POINTS}}               <- Points
  {{NEXT_MEETING_DATE}}/{{NEXT_MEETING_TIME}} <- Meetings row
  {{LOCATION}}                      <- Decoder.Clients (NOT the app)
Save the filled doc to the matter folder. Leave all non-token content blank for
the firm to complete.

== AUTOMATION 5 — DEADLINES & REMINDERS ==
For each Deadlines row, map Kind Code -> Deadline Type via Decoder.Kinds, and set
an Outlook reminder / calendar item firm-side (e.g. 7 days and 1 day before Due
Date). Client name/location come from the Decoder, never from the app.

== AUTOMATION 6 — TASKS HAND-OFF ==
For each Tasks row, map Category Code -> Task Category via Decoder.Categories and
notify the admin: "Client #<number> — category <label>". No free text; the code
carries the meaning.

== AUTOMATION 7 — DAILY FOLLOW-THROUGH ==
Read FollowUp rows; map Step Number -> wording via Decoder.Steps. On a Recurrence
trigger (e.g. each evening) send the lawyer/admin a yes/no checklist status for
the day's steps.

== AUTOMATION 8 — END-OF-DAY ROLLUP (admin enablement) ==
Recurrence flow (e.g. 18:00 local): compile today's TimeLog totals per Client
Number, plus any Meetings/Deadlines/Tasks for today, join names via the Decoder,
and email the admin a one-screen summary so the lawyer never has to message
anyone. The admin acts off this email + the sheet.

== AUTOMATION 9 — SCHEDULED EXPORT / BACKUP ==
Recurrence flow that saves a dated copy of the Hours Log (and optionally a
filtered per-client export) to a firm folder, and emails it to the admin on
request. This is how the "export from the backend" happens once data is in
Microsoft.

== DELIVERABLES ==
1. The flows above, named as listed, enabled in this tenant.
2. The Summary and firm-side billing views populated.
3. A short note of where filled follow-up docs and dated exports are saved.
4. Confirmation that no automation writes names/content into TimeLog and that
   nothing sends data back to the app.

== OPTIONAL: LIVE FEED LATER ==
If the app is later pointed at a live endpoint, add a Power Automate "When an
HTTP request is received" trigger that does Compose = json(triggerBody()) then
"Add a row into a table" -> TimeLog (handle text/plain and application/json), and
require a secret token field (reject mismatches with 401). All automations above
keep working unchanged because they read the workbook, not the transport.
```

---

This prompt builds the firm-side brain. The app stays a dumb, anonymous sender;
Copilot + the Decoder turn numbers into billing, documents, reminders, and the
admin's daily rollup.
