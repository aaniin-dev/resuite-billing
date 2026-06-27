# RESUITE — Microsoft Integration Prompt (CORE / test this first)

Goal of this step: prove ONE thing works end-to-end — a time entry leaves the app and lands as a row in a Microsoft spreadsheet, automatically. Everything else (reminders, follow-through, deadlines, meetings, tasks) is parked in the roadmap until this connects.

Paste the block below into **Microsoft 365 Copilot** (with Power Automate / Copilot Studio access).

**Privacy contract:** the app transmits ONLY a client number, dates, times, and numbers. No names, no content, ever. Identity stays firm-side, mapped by number.

---

```
Set up an anonymous billable-hours intake for a law firm. Build EXACTLY this — no extra fields, no names, no rates, no rounding changes. The sender is a one-way app: it POSTs data and can never read anything back. Every message contains ONLY a client number, dates, times, and numbers.

== STEP 1 — WORKBOOK ==
Create an Excel workbook "RESUITE Hours Log" in OneDrive/SharePoint.
Add an Excel Table named "TimeLog" with these columns, in order:
  1. Client Number — text
  2. Date          — date (YYYY-MM-DD)
  3. Start         — text "HH:MM" (may be blank)
  4. Stop          — text "HH:MM" (may be blank)
  5. Minutes       — whole number
  6. Points        — number (billable tenths of an hour)
  7. Logged At     — date/time (set on insert)

Add a verification column "Points Check" = ROUNDUP([@Minutes]/6,0)/10
It must equal Points on every row (conditional-format red if not).
This is the legal tenth-of-an-hour rule — every started 6-minute unit = 0.1, always rounded UP:
  1–6=0.1, 7–12=0.2, 13–18=0.3, 19–24=0.4, 25–30=0.5, 31–36=0.6, 37–42=0.7, 43–48=0.8, 49–54=0.9, 55–60=1.0 (then +0.1 per 6-min unit). Use ROUNDUP, never ROUND/MROUND.

== STEP 2 — INTAKE FLOW ==
Create a Power Automate cloud flow "RESUITE Intake".
Trigger: "When an HTTP request is received" (this generates a POST URL).
Expected JSON body:
  { "type":"time", "clientNumber":"428193", "date":"2026-06-27", "start":"14:15", "stop":"14:48", "minutes":33, "points":0.6 }
Notes:
  - The app may send Content-Type "text/plain" (to avoid a browser CORS preflight). Do NOT assume auto-parsing — add a step: Compose = json(triggerBody()), then read fields from that. (A server backend like Vercel can instead send proper application/json — handle both.)
Action: "Add a row into a table" → TimeLog, mapping clientNumber/date/start/stop/minutes/points, and Logged At = utcNow().
Respond 200.

== OPTIONAL LOCK (recommended once it works) ==
Accept a "token" field in the body and, as the first action, Condition: if token <> "<a long random string you choose>", respond 401 and stop. This keeps the write-only endpoint from accepting rows from anyone who finds the URL. Put the same string in the app's settings.

== DELIVERABLE ==
After building, give me the trigger's POST URL. I paste it into the app (⚙ Connect spreadsheet). That URL is the only thing the app knows — it is write-only.

== RULES ==
- Anonymous only: client = number. No names/labels/locations.
- Append-only: every send is its own row; never overwrite or de-duplicate. (Copilot sorts/sums by Client Number on its side.)
- One-way: never build anything that sends data back to the app.
```

---

## Test sequence (do these in order)
1. Run the prompt → Copilot builds the workbook + flow → copy the **POST URL** it returns.
2. App → **⚙ Connect spreadsheet** → paste URL → Save. Chip turns green ("Synced").
3. Make a **New Client #**, tap **+ Time Entry**, enter a start/stop, **Add & Send**.
4. Open **TimeLog** — a row should appear with matching Minutes/Points within a few seconds.
5. If nothing lands: open the flow's **run history** in Power Automate — it shows the exact body received and which step failed (usually the `json(triggerBody())` parse or a column-name mismatch).

Once a row reliably lands, the integration is proven. Then open the roadmap to add the rest.
