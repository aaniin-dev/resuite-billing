# RESUITE — Simple one-prompt setup (paste once, you're done)

This is the *plug-it-in* version: one paste into Microsoft 365 Copilot, it builds
everything, hands you one link, you paste that link into the app. Done. Scoped to
the basics — stay organized, get a couple of meeting reminders, and hand the admin
a to-do list.

## The 3 steps for the customer
1. Open Microsoft 365 Copilot. Paste the prompt below. Let it finish.
2. Copilot replies with one **link (POST URL)**. Copy it.
3. In the RESUITE app → ⚙ Settings → **Connect to Copilot spreadsheet** → paste → Save.

That's the whole setup. From then on, when they export, their hours land in the
sheet, upcoming meetings get a reminder, and the admin gets a running to-do list.

---

```
Set up a simple, automated time-tracking backend for me in Microsoft 365. Build
everything yourself — I should only have to copy one link at the end. Keep it
basic and organized.

1) WORKBOOK
Create an Excel workbook "RESUITE Hours Log" in my OneDrive with a table "TimeLog":
Client Number, App Number, Date, Start, Stop, Minutes, Points, Logged At,
Points Check (= ROUNDUP([@Minutes]/6,0)/10). Turn Points Check red if it ≠ Points.
Add a small "Mapping" table (App Number, Client Number) — when a new App Number
shows up, assign it the next Client Number so I never store client names.

2) INTAKE (the link I paste into the app)
Create a Power Automate flow "RESUITE Intake" with trigger "When an HTTP request
is received". Steps: Compose = json(triggerBody()); look up App Number in Mapping
(create one if new); add a row to TimeLog; set Logged At = utcNow(); respond 200.
It will receive either of these:
  {"type":"time","appNumber":"123456","date":"2026-06-27","start":"14:15","stop":"14:48","minutes":33,"points":0.6}
  {"type":"nextMeeting","appNumber":"123456","date":"2026-06-27","time":"15:30"}

3) A COUPLE OF MEETING REMINDERS
When a "nextMeeting" comes in: create an Outlook calendar event titled
"Client [Client Number] — Next Meeting" at that date/time, and set a reminder the
day before. Keep it simple — just the calendar event + one reminder.

4) ADMIN TO-DO LIST
Create a Microsoft To Do (or Planner) list called "RESUITE — Admin". For each
"nextMeeting", add a task: "Prep Client [Client Number] — meeting [date] [time]".
This is the list the admin works from. Optionally email the admin this list each
Friday.

5) DELIVERABLE
Return the HTTP POST URL for "RESUITE Intake". That's the only thing I need.
Return it now.
```

---

## How to be sure it's exactly what they need (1-minute check)
After they paste the link into the app:
1. In the app, start a timer for a few seconds, stop it, then tap **Export**.
2. Open **RESUITE Hours Log** → a row should appear in `TimeLog` with matching
   minutes/points.
3. In the app, open **Follow-up → Next meeting**, pick a date/time, save, **Export**.
4. Check Outlook for the calendar event + reminder, and the **RESUITE — Admin**
   list for the new task.
If those four show up, it's wired correctly.

## When to use which prompt
- **This (SIMPLE)** — most customers. Organized sheet, meeting reminders, admin list.
- **`copilot-setup-prompt.md` (FULL)** — when they want the whole engine: BOD/EOD
  summaries, switch-matter status, dormant/high-activity alerts, monthly billing
  packets, emoji+color identities.
