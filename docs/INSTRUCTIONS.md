# RESUITE — How to plug it in & use it

A one-page guide. Part 1 is the one-time setup. Part 2 is daily use.

## Part 1 — Connect it (one time, ~5 min)
1. Open the app: **https://resuite-billing.vercel.app** (add it to your home screen).
2. **Create an account** — email + password. (It's free during beta.)
3. Open **Microsoft 365 Copilot** and paste the **Simple Setup prompt**
   (`Copilot prompt — SIMPLE (one-prompt plug)`). Let it finish.
4. Copilot replies with **one link** (a POST URL). Copy it.
5. In the app: **⚙ Settings → Connect to Copilot spreadsheet → paste the link → Save.**
6. Done. You're connected.

## Part 2 — Daily use
- **Start a session:** tap **Create & start timer**. A private client number is
  generated (no names ever leave the device).
- **While you work:** the timer runs. Tap the center button to **pause/resume**.
  Every ~30 min it asks "Are you still there?" — if you don't answer in 3 minutes
  it auto-pauses, so time never logs against the wrong matter.
- **Switch matters:** tap the ⇄ icon. It banks the current time first, then moves over.
- **Stop:** tap ■ — it saves the entry, rounded up to the legal 0.1-hour unit.
- **Follow-up (tap "Follow-up"):** set the **Next meeting** (date + time) and tap any
  hand-off — **Email, Documents, Signatures, Admin** — to put it on the admin's list.
- **Export (do this daily):** ⚙ Settings → **Export now** (or the Friday reminder).
  This downloads a copy, keeps a copy in **Your records**, and — if connected —
  sends your hours + next meetings to Microsoft.

## What happens on the Microsoft side
- Your hours land in the **RESUITE Hours Log** spreadsheet (points auto-checked).
- Each **Next meeting** becomes an **Outlook calendar event + a reminder**.
- Each hand-off becomes a task on the **"RESUITE — Admin"** to-do list for your admin.

## Reminders & records
- **Check-in:** 5 / 15 / 30 (recommended) / 45 min, or Off — in Settings.
- **Weekly:** a Friday-noon nudge to export, with a quick "what to automate next
  week?" note.
- **Your records:** every export is kept in the app (Settings → Your records),
  re-downloadable any time.

## Privacy
The app only ever sends a number, dates, times, and codes. Client names, rates,
and locations live only on your Microsoft side and are matched back by number.

## Troubleshooting
- **No rows in the sheet?** Make sure you tapped **Export**, and that the Connect
  URL is saved in Settings.
- **Reminders feel stale?** Export daily — the app sends when you export.
- **Forgot your password?** The account is device-local with no reset; you'd
  create a new one (your exported records are safe).
