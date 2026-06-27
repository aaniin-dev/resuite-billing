# RESUITE → Copilot integration prompt (export / import — no live connection)

Paste the block below into **Microsoft 365 Copilot** (with Power Automate /
Copilot Studio).

**Important privacy model:** RESUITE never holds a live connection to Microsoft —
that would be a leak. The app holds everything on the device and the lawyer
**exports a file** (one CSV with a `Type` column and an `Exported At` date). They
import that file into the Microsoft workbook. The app is the *trigger* that starts
the chain; the booking and all client identity happen on the Microsoft side using
the firm's internal records. Copilot uses the `Exported At` column to process only
the latest export (acknowledge the watermark) and skip rows it already handled.

---

```
Set up an import-driven integration for an anonymous legal time-tracking app
called RESUITE. There is NO live/webhook connection — do not create an HTTP
trigger. Data arrives only as a CSV the lawyer exports from the app and imports
into the "RESUITE Hours Log" workbook. The CSV/app sends ONLY numbers — a client
number, dates, times, minutes, points, and number codes. Never expect names or
free text from the app. Client identity (name, email, location, matter, rate)
lives ONLY in the access-restricted "RESUITE Decoder" workbook and is joined back
by client number.

== THE EXPORT FILE (the input) ==
One row per action, with these columns:
  Type | Client Number | Date | Start | Stop | Minutes | Points | Time | Category | Exported At
Types:
  time     -> Date, Start, Stop, Minutes, Points
  meeting  -> Date (the NEXT appointment date), Time
  task     -> Date, Time, Category   (1=Documents 2=Email 3=Signatures 4=Admin 5=Follow up)
"Exported At" is the same timestamp on every row of a given export = the export
watermark.

== STEP 1 — INGEST THE LATEST EXPORT ==
Trigger: "When a row is added/modified" in the import staging table, OR a manual/
scheduled run after each import. (Optional: the app can also push the same CSV to
an HTTP trigger — but ONLY when the lawyer exports, never per-entry/live. If you
enable that, parse the CSV body and apply the exact same watermark logic below.)
- Track the most recent "Exported At" you have already processed (store it).
- Process only rows whose "Exported At" is newer; append them to the matching
  table (TimeLog / Meetings / Tasks). Append-only — never overwrite or de-dupe.
- After processing, save the new watermark so the next import is acknowledged and
  nothing is double-booked.

== STEP 2 — AUTO-BOOK THE NEXT APPOINTMENT (the main ask) ==
For every row where Type = meeting (a next appointment from the app):
  1. Read its Client Number (e.g. 1001) and Date/Time (e.g. 2026-08-01 10:00).
  2. Look that client up in Decoder.Clients by Client Number -> name, email,
     location, matter/sheet #.
  3. Immediately create the Outlook calendar event for the next appointment using
     the firm's stored info: title "{Client Name} — {matter}", invite the client
     email, set the location, on that date/time, with a reminder. Write the row to
     the Meetings table.
The app supplies only "client 1001, next appointment 2026-08-01" — Copilot fills
in WHO 1001 is and books it from the Microsoft-side record.

== STEP 3 — TIME + HAND-OFFS ==
- time rows: append to TimeLog (points already = ROUNDUP(minutes/6,0)/10; never
  recompute differently). Update the per-client Summary.
- task rows: map Category -> label via Decoder.Categories and notify the admin
  ("Client #1001 — Signatures"); for Signatures (3) also raise the e-sign request.

== RULES ==
- Import only — no data ever flows back to the app, and there is no live endpoint.
- Anonymous in, named out: names/locations/emails come only from the Decoder.
- Use "Exported At" as the idempotency key so re-importing the same file is safe.

== DELIVERABLE ==
Confirm that importing an export with a meeting row for a client auto-creates the
Outlook appointment for that client from the Decoder, and that re-importing the
same file does not double-book (Exported At watermark respected).
```

---

So your example works end to end: the app exports `meeting, 1001, 2026-08-01,
10:00`; the lawyer imports it; Copilot looks up client 1001 in the Decoder and
books the Aug 1 appointment on the calendar with that client's real name, email,
and location — none of which ever left the app.
