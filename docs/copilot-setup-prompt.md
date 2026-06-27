# ⭐ RESUITE Setup Prompt (Copy/Paste Into Microsoft 365 Copilot)

Paste this into Microsoft 365 Copilot (Word, Excel, or Copilot app). Copilot will
build your entire RESUITE backend automatically.

This is the canonical setup. The RESUITE app emits exactly the fields below:
`type`, `appNumber`, `clientNumber`, `date`, `start`, `stop`, `minutes`, `points`
(time) and `type:"nextMeeting"` with `time`. App Number is the anonymous number the
app generates; the Mapping table assigns the internal Client Number.

---

## RESUITE — Full System Setup Prompt

Create a complete RESUITE time-tracking backend inside my Microsoft 365
environment. Build everything automatically. I should not have to configure
anything manually except copying the POST URL you return at the end.

### 1 — Create Workbook
Create an Excel workbook named **RESUITE Hours Log** in my OneDrive.
Add a table named **TimeLog** with these columns, in order:
1. Client Number (text)
2. App Number (text)
3. Date (date, YYYY-MM-DD)
4. Start (text HH:MM)
5. Stop (text HH:MM)
6. Minutes (whole number)
7. Points (decimal)
8. Logged At (date/time)
9. Points Check (formula = ROUNDUP([@Minutes]/6,0)/10)

Apply conditional formatting: Points Check turns red if it does not equal Points.

### 2 — Create Mapping Table
Add a second table named **Mapping** with columns:
- App Number
- Client Number
- Emoji
- Color

This table maps anonymous App Numbers to internal Client Numbers and assigns each
client a visual identity. When a new App Number appears, generate a new Client
Number and assign the next available emoji and color.

### 3 — Create Intake Flow
Create a Power Automate cloud flow named **RESUITE Intake**.
Trigger: When an HTTP request is received. Return the POST URL at the end of this setup.
Expected JSON body:
```
{
  "type":"time",
  "appNumber":"123456",
  "clientNumber":"428193",
  "date":"2026-06-27",
  "start":"14:15",
  "stop":"14:48",
  "minutes":33,
  "points":0.6
}
```
Steps:
1. Compose = json(triggerBody())
2. Lookup App Number in Mapping table
3. If not found: create new Client Number, assign emoji + color, add row to Mapping
4. Add row to TimeLog
5. Logged At = utcNow()
6. Respond 200

### 4 — Create Automation Flow
Create a second flow named **RESUITE Automation**.
Trigger: When a new row is added to TimeLog.
Actions:
**A. Validation** — Minutes whole; Points = ROUNDUP(Minutes/6,0)/10; Date valid;
Start/Stop HH:MM. If invalid: add comment to row.
**B. Daily Workflow** — first entry of the day → BOD summary; last entry → EOD summary.
**C. Weekly Workflow** — entry on Friday → weekly billing summary.
**D. Switch Matter Logic** — new entry within 10 minutes for a different Client
Number → mark previous "On Hold", new "Active".
**E. Follow-Through** — dormant client alert (7 days no activity); high activity
alert (3+ entries/day); gap alert (long idle time).
**F. Billing Prep** — daily totals; weekly totals; monthly totals; export-ready
billing packet.

### 5 — Outlook Integration
Enable Copilot to send Outlook emails automatically: BOD check-in; EOD summary;
Friday weekly billing; dormant client alerts; high activity alerts; BRB return
reminders; deadline reminders. Emails must use the emoji + color identity from the
Mapping table.

### 6 — Next Meeting Button
Add support for a "Next Meeting" action. When I click Next Meeting in the RESUITE
app, the app sends:
```
{
  "type":"nextMeeting",
  "appNumber":"123456",
  "clientNumber":"428193",
  "date":"2026-06-27",
  "time":"15:30"
}
```
In the Automation Flow:
- Create an Outlook calendar event
- Title: "Client [Client Number] — Next Meeting"
- Time: date + time
- Body: "Scheduled via RESUITE"
- Use the client's emoji + color in the subject line

### 7 — Deliverable
At the end of this setup, return the HTTP POST URL for the RESUITE Intake flow. I
will paste that URL into the RESUITE mobile app under Connect Spreadsheet.

End of RESUITE Setup Prompt. Return the POST URL now.

---

## How the app feeds this

- Paste the returned POST URL into the app: **⚙ Settings → Connect to Copilot
  spreadsheet**.
- The app sends each record as JSON matching the schema above — but only **when you
  export** (the safeguard), never silently per-entry. A local copy is always kept,
  and the manual CSV export (with App Number + Client Number columns) stays
  available.
- **Note on time-based triggers:** "first/last entry of the day" and
  "switch matter within 10 minutes" need events to arrive close to real time. With
  export-gated sending they fire when you export, so export daily (or more often)
  for those to be accurate. Daily/weekly summaries and Next Meeting work fine on a
  daily export.
