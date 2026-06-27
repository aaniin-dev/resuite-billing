# RESUITE → Copilot integration prompt

Paste the block below into **Microsoft 365 Copilot** (with Power Automate /
Copilot Studio). It wires the RESUITE app's input fields into your tenant and
**auto-triggers a "next meeting" workflow per client** every time the app logs
something — so the lawyer can immediately set the next meeting date/time for that
exact client. Works whether entries arrive live (HTTP) or via the spreadsheet
import.

---

```
Set up an integration for an anonymous legal time-tracking app called RESUITE.
The app is the INPUT. It sends only numbers — a client number, dates, times, and
number codes. Never expect or store client names or free text on anything the app
touches; the human meaning lives only in a separate, access-restricted "RESUITE
Decoder" workbook and is joined back by client number.

== INPUT FIELDS FROM THE APP ==
The app sends one JSON object per action (live POST), and the same fields arrive
as spreadsheet rows when imported. Handle every "type":

  time     { type:"time",     clientNumber, date, start, stop, minutes, points }
  meeting  { type:"meeting",  clientNumber, date, time }            // a next meeting
  task     { type:"task",     clientNumber, date, time, category }  // a hand-off
  step     { type:"step",     clientNumber, stepId, done, date, time }

Category codes (task.category): 1=Documents, 2=Email, 3=Signatures, 4=Admin,
5=Follow up. Map codes to labels via Decoder; never write the label back to the app.

== STEP 1 — INTAKE ==
Create a flow "RESUITE Intake".
- Live mode: trigger "When an HTTP request is received"; first action
  Compose = json(triggerBody()) (the app may send text/plain), then read fields.
- Import mode: the same fields are columns in the "RESUITE Hours Log" workbook
  (TimeLog / Meetings / Tasks tables). A scheduled or on-edit trigger reads new rows.
Branch with a Switch on "type" and append each record to its matching table
(append-only — never overwrite or de-duplicate).

== STEP 2 — AUTO-TRIGGER THE NEXT-MEETING WORKFLOW (the main ask) ==
This must fire automatically off the client number in whatever the app just sent.

On ANY new record for a clientNumber (a time entry, a task, or a meeting):
  1. Look up that client in Decoder.Clients by clientNumber → name, matter/sheet #,
     location, hourly rate.
  2. Open or create a per-client "Next meeting" workflow item for that client:
     - Create a DRAFT Outlook calendar event seeded with the client's name,
       matter, and location (pulled from the Decoder — NOT from the app), with the
       date/time left for the lawyer to fill.
     - Send the lawyer a one-click action (Teams/Outlook adaptive card or a task):
       "Set the next meeting for {Client Name} (Sheet #{matter})?" with quick
       date/time pickers. Confirming finalizes the calendar event and a reminder.
  3. Keep it per-client: if a draft already exists for that client, update it
     instead of creating a duplicate.

When the app itself sends a "meeting" record (the lawyer set a next meeting in
the app): skip the prompt — directly create the confirmed Outlook event for that
clientNumber at the given date/time, add a reminder, and write the row to the
Meetings table.

== STEP 3 — HAND-OFFS (tasks) ==
For each "task" record, map category → label via Decoder.Categories and notify
the admin: "Client #{number} — {label}". For Signatures (code 3), also create the
signature/e-sign request task. No free text; the code carries the meaning.

== RULES ==
- Anonymous in, named out: the app never sends names; names/locations/rates come
  only from the Decoder, joined by client number.
- One-way: never send anything back to the app.
- Append-only; the billing rule is ROUNDUP(minutes/6,0)/10 — never recompute
  points a different way.

== DELIVERABLE ==
Give me (1) the HTTP trigger POST URL to paste into the app's ⚙ Connect
spreadsheet, and (2) confirmation that a new entry for a client automatically
surfaces a "set next meeting" action for that client.
```

---

Drop the POST URL it returns into the app under **⚙ Settings → Spreadsheet
connection**. After that, every time the lawyer logs time (or taps a Follow-up
action) for a client, Copilot will surface a "set the next meeting" prompt for
that exact client — and when they set a next meeting in the app, it lands on the
calendar automatically.
