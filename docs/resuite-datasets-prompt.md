# RESUITE — Master "Build All Data Sets" Prompt

Paste the block below into your builder (works in **Claude Code** to generate the actual `.xlsx` + `.docx` files, or in **Microsoft Copilot** to build the live versions in your tenant). It produces every data set RESUITE needs and documents exactly how each field connects — app → flow → spreadsheet → document.

**The one rule that governs everything:** the phone app transmits ONLY a client number, number codes, yes/no, dates, and times. Every human-readable label (names, task wording, locations) lives ONLY in the firm-side decoder tables and is joined in by client/code number. Never put a name or free-text content on anything the app touches.

---

```
Build the complete RESUITE data layer for an anonymous legal time-tracking system. Produce ALL of the artifacts below, exactly as specified. Do not invent fields or change the billing formula. Output the spreadsheet as an .xlsx, the document as a .docx, and the connection map as a .md (or build the live equivalents in Microsoft 365 if that's the environment).

PRIVACY CONTRACT (applies to everything):
- Data that travels from the app: client number, number codes, yes/no, dates, times, minutes, points. Nothing else.
- Human-readable meaning (client names, task wording, locations, emails) lives ONLY in the firm-side DECODER tables and is joined in by number. Never store names/content on app-facing tables or transmit them.

=====================================================================
ARTIFACT 1 — SPREADSHEET TRACKER  (workbook: "RESUITE Hours Log")
=====================================================================
Create these sheets/tables.

TABLE "TimeLog"  (the core — every time entry, append-only):
  Client Number (text) | Date (date) | Start (text HH:MM) | Stop (text HH:MM) | Minutes (int) | Points (number) | Logged At (datetime)
  + calculated column "Points Check" = ROUNDUP([@Minutes]/6,0)/10  (must equal Points; red if not)
  Billing rule — every started 6-minute unit = 0.1, rounded UP. Use ROUNDUP, never ROUND/MROUND:
    1–6=0.1 7–12=0.2 13–18=0.3 19–24=0.4 25–30=0.5 31–36=0.6 37–42=0.7 43–48=0.8 49–54=0.9 55–60=1.0 (then +0.1 per unit)

TABLE "Meetings":
  Client Number (text) | Date (date) | Time (text HH:MM) | Logged At (datetime)

TABLE "Deadlines":
  Client Number (text) | Due Date (date) | Kind Code (int) | Logged At (datetime)

TABLE "Tasks":
  Client Number (text) | Date (date) | Time (text HH:MM) | Category Code (int) | Logged At (datetime)

TABLE "FollowUp":
  Date (date) | Step Number (int) | Done (yes/no) | Time (text HH:MM) | Logged At (datetime)

SHEET "Summary"  (per unique Client Number):
  Client Number | Total Points =SUMIF(TimeLog[Client Number],[@Client Number],TimeLog[Points])
               | Total Minutes =SUMIF(TimeLog[Client Number],[@Client Number],TimeLog[Minutes])
               | Entry Count =COUNTIF(TimeLog[Client Number],[@Client Number])
  (Do NOT add dollar/rate columns here — rates live in the firm-side decoder.)

=====================================================================
ARTIFACT 2 — FIRM-SIDE DECODER TABLES  (separate workbook: "RESUITE Decoder" — never exposed to the app)
=====================================================================
These hold the human meaning and are joined to the tracker by number. Keep this file access-restricted.

TABLE "Clients":   Client Number (text) | Client Name | Matter/Sheet # | Hourly Rate | Location/Address
TABLE "Steps":     Step Number (int) | Task Wording        (e.g. 1="Logged hours", 2="Sent what was promised", 3="Booked next meeting")
TABLE "Kinds":     Kind Code (int) | Deadline Type         (e.g. 1=Filing, 2=Response due, 3=Signing)
TABLE "Categories":Category Code (int) | Task Category      (1=Documents, 2=Emails, 3=Other; firm can add rows)
  Billing example (firm-side only): Amount = TimeLog Points × Clients[Hourly Rate], looked up by Client Number.

=====================================================================
ARTIFACT 3 — DOCUMENT TEMPLATE  ("Meeting Follow Up Form.docx")
=====================================================================
Reproduce this form. Fields marked {{LIKE_THIS}} are CONNECTION POINTS — auto-filled from the data layer, joined by Sheet #/Client Number. Everything NOT in braces is blank for the firm to fill (content, never auto-filled).

  Sheet #: {{SHEET_NUMBER}}
  Client:  {{CLIENT_NAME}}            (from Decoder.Clients, looked up by Client Number)
  Date:    {{DATE}}
  Start Time: {{START}}

  Mode:    ☐ Team/Zoom   ☐ In-Person
  Purpose: ☐ Initial Meeting   ☐ Design and Trust Review   ☐ Disability Docs and Funding Review   ☐ Signing and Funding
  To Do's: 1. ______   2. ______   3. ______
  Send:    ☐ Questionnaire ☐ Handbook ☐ Engagement Letter ☐ Presentation/PP ☐ Spreadsheet ☐ Trust(s) ☐ Will(s) ☐ Financial POA ☐ Health POA ☐ HIPAA
  Misc.:   1. ______   2. ______   3. ______

  End Time:      {{STOP}}
  Total Time:    {{TOTAL_HM}}        (= Stop − Start, shown as h:mm)
  Billable Time: {{BILLABLE_POINTS}} (= Points)

  Next Meeting:
    Date:     {{NEXT_MEETING_DATE}}
    Time:     {{NEXT_MEETING_TIME}}
    Location: {{LOCATION}}           (from Decoder.Clients — NOT from the app)

Footer note on the template: "Time fields auto-filled from RESUITE by Sheet #. Content entered by firm. No client data stored on the device."

=====================================================================
ARTIFACT 4 — CONNECTION MAP  (output as "RESUITE-connection-map.md")
=====================================================================
Produce a table documenting every field's full path. Use exactly these rows:

  App payload field      -> Tracker column          -> Doc token            -> Decoder join
  type:"time".clientNumber -> TimeLog.Client Number  -> {{SHEET_NUMBER}}/{{CLIENT_NAME}} -> Clients by Client Number
  type:"time".date         -> TimeLog.Date           -> {{DATE}}             -> —
  type:"time".start        -> TimeLog.Start          -> {{START}}            -> —
  type:"time".stop         -> TimeLog.Stop           -> {{STOP}} / {{TOTAL_HM}} -> —
  type:"time".minutes      -> TimeLog.Minutes        -> {{TOTAL_HM}}         -> —
  type:"time".points       -> TimeLog.Points         -> {{BILLABLE_POINTS}}  -> —
  type:"meeting".time      -> Meetings.Time          -> {{NEXT_MEETING_TIME}}-> —
  type:"meeting".date      -> Meetings.Date          -> {{NEXT_MEETING_DATE}}-> —
  (location)               -> (none — app never sends)-> {{LOCATION}}        -> Clients by Client Number
  type:"deadline".kind     -> Deadlines.Kind Code    -> —                    -> Kinds by Kind Code
  type:"task".category     -> Tasks.Category Code     -> —                    -> Categories by Category Code
  type:"step".stepId       -> FollowUp.Step Number    -> —                    -> Steps by Step Number

Also state the JSON the app POSTs for each type:
  time:    {type,clientNumber,date,start,stop,minutes,points}
  meeting: {type,clientNumber,date,time}
  deadline:{type,clientNumber,date,kind}
  task:    {type,clientNumber,date,time,category}
  step:    {type,clientNumber,stepId,done,date,time}

RULES: anonymous numbers only on app-facing artifacts; labels only in Decoder; ROUNDUP(min/6,0)/10 verbatim; append-only; one-way (nothing ever sent back to the app).
```

---

## What you'll get back
- **RESUITE Hours Log.xlsx** — the live tracker (TimeLog + Meetings/Deadlines/Tasks/FollowUp + Summary, formula built in).
- **RESUITE Decoder.xlsx** — the firm-only key that turns numbers/codes back into names, tasks, rates, and locations.
- **Meeting Follow Up Form.docx** — your template with `{{tokens}}` at each connection point, content sections left blank.
- **RESUITE-connection-map.md** — the one-page wiring diagram so anyone can see how a tap on the phone becomes a row and a filled form.

Start with just **TimeLog + the doc template** to match what you're testing now; the other tables are already specified for when you switch the roadmap features on.
