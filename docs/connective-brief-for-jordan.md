# RESUITE — Connective Brief (for Jordan)

**Owner:** Chelsee · **Repo:** `aaniin-dev/resuite-billing` · **App:** static site (`index.html`), deploys on Vercel

This brief is the full picture of how the RESUITE time-tracking app should
connect to Microsoft 365, what is working today, and exactly what you (Jordan)
need to build to make the connection automatic. Read the **Current state** and
**Your job** sections first; the rest is reference.

---

## 1. What this system does (in one paragraph)

A lawyer logs billable time on a phone web app. The app is deliberately
**anonymous** — it transmits only a **client number, dates, times, minutes, and
point values**, never a name or any free text. Those rows land in a Microsoft
Excel workbook ("RESUITE Hours Log"). On the firm side, Copilot + a private
**decoder** workbook join the anonymous numbers back to real client names,
rates, and matters to produce billing and documents. The phone never holds, and
the wire never carries, anything that could identify a client.

**The billing rule is legal and non-negotiable:** every started 6-minute unit =
0.1 hr, always rounded **up**. Formula: `ROUNDUP(minutes/6, 0) / 10`
(JS: `Math.ceil(min/6)/10`). Never `ROUND`/`MROUND`. 33 min → 0.6, not 0.5.

---

## 2. Current state (what works TODAY)

The connection piece is **not yet live**. Right now the app is an **internal
data holder with a manual spreadsheet bridge**:

1. Entries are saved in the browser's `localStorage` (survives refresh, per
   device).
2. The user taps **⬇ Export CSV** → downloads `resuite-hours-YYYY-MM-DD.csv`
   with columns: `Client Number, Date, Start, Stop, Minutes, Points`.
3. That CSV is **manually imported** into the **RESUITE Hours Log** workbook
   (the blank template ships in this repo — see §6), which Copilot then reads.

This works and is safe to use immediately. It is the stopgap until the
automatic path below exists. **The "broken/missing" part is only the automatic
write — there is no live endpoint yet because no flow/API has been built.**

The app is already wired for the automatic path: if a webhook URL is saved in
**⚙ Connect spreadsheet**, every entry is `POST`ed automatically (see §4). It is
blank because the endpoint does not exist yet. That endpoint is your job.

---

## 3. The two ways to connect (pick one)

### Option A — Power Automate webhook  ✅ recommended
- The app holds **no Microsoft credentials**. Auth is baked into the trigger
  URL's signature.
- **Sign-in happens once, by you, inside Power Automate** when you create the
  flow — the flow's Excel connector authenticates as your account (or, better, a
  dedicated service account). The app just fires JSON at the URL.
- No OAuth code, no secrets in the browser, fastest to ship.
- This is what `docs/copilot-prompt.md` already specifies — that prompt builds
  the workbook **and** the flow and hands back the POST URL.

### Option B — Microsoft Graph API (OAuth / app sign-in)
- The app or a back-end authenticates to Microsoft Graph and writes rows via:
  `POST /me/drive/root:/RESUITE Hours Log.xlsx:/workbook/tables/TimeLog/rows/add`
- Requires: an **Entra ID (Azure AD) app registration**, client ID + secret (or
  certificate), OAuth scopes (`Files.ReadWrite` delegated, or `Files.ReadWrite.All`
  application), and token handling.
- **Secrets must live in a back-end** (e.g. a Vercel serverless function), never
  in `index.html`. The browser would call your function; the function holds the
  secret and calls Graph.
- Choose this only if you need two-way sync, want to avoid Power Automate
  licensing, or need to write to a SharePoint document library with finer control.

**Recommendation:** Option A now. Revisit Option B only if requirements grow.

### "Do we sign into Microsoft?" — the precise answer
- **Option A:** No app sign-in. You sign in once in Power Automate while
  building the flow. The app never authenticates.
- **Option B:** Yes — that's the OAuth sign-in, but it belongs to a back-end
  service, registered in Entra ID, not to the phone app.

---

## 4. The data contract (don't change this)

The app POSTs one JSON body per time entry. It sends `Content-Type:
text/plain;charset=UTF-8` on purpose — that avoids a browser CORS preflight, and
Power Automate can still parse it. A back-end (Option B) may send real
`application/json`; handle both.

```json
{
  "type": "time",
  "clientNumber": "428193",
  "date": "2026-06-27",
  "start": "14:15",
  "stop": "14:48",
  "minutes": 33,
  "points": 0.6
}
```

Field → column mapping (TimeLog table):

| JSON field      | TimeLog column   | Notes                                   |
|-----------------|------------------|-----------------------------------------|
| `clientNumber`  | Client Number    | text, anonymous                         |
| `date`          | Date             | `YYYY-MM-DD`                            |
| `start`         | Start            | `HH:MM`, may be blank (duration mode)   |
| `stop`          | Stop             | `HH:MM`, may be blank                    |
| `minutes`       | Minutes          | whole number                            |
| `points`        | Points           | tenths, already rounded UP by the app   |
| —               | Logged At        | set server-side on insert (`utcNow()`)  |

Future entry types (already specified in `docs/roadmap.md`, all use the same
`type` switch): `meeting`, `deadline`, `task`, `step`. Build the time path first.

---

## 5. Your job — build Option A (step by step)

1. **Create the workbook.** Use the blank template in this repo
   (`templates/RESUITE Hours Log.xlsx`, §6) or let Copilot build it from
   `docs/copilot-prompt.md`. Put it in OneDrive or a SharePoint library the
   service account can reach. Confirm the table is named **`TimeLog`** with the
   columns in §4.
2. **Build the flow** "RESUITE Intake" in Power Automate:
   - Trigger: **When an HTTP request is received** (generates the POST URL).
   - First action: `Compose` = `json(triggerBody())` (handles `text/plain`).
   - Action: **Add a row into a table** → `TimeLog`, mapping
     clientNumber/date/start/stop/minutes/points, and `Logged At = utcNow()`.
   - Respond `200`.
3. **Lock the endpoint (do this).** Accept a `token` field in the body; as the
   first condition, if `token` ≠ a long random secret you choose, respond `401`
   and stop. Store the same string in the app's settings. This keeps the
   write-only URL from accepting rows from anyone who finds it.
4. **Hand the POST URL to Chelsee.** She pastes it into the app via **⚙ Connect
   spreadsheet**. The sync chip turns green and entries flow automatically.
5. **Test:** create a client #, add a 14:15–14:48 entry, tap **Add & Send** → a
   row should appear in `TimeLog` with `Minutes 33`, `Points 0.6` within
   seconds. If not, open the flow's **run history** — it shows the exact body and
   the failing step (usually the `json()` parse or a column-name mismatch).

### If you go Option B instead
- Register an app in Entra ID; grant `Files.ReadWrite` (delegated) or
  `Files.ReadWrite.All` (application).
- Stand up a Vercel serverless function (e.g. `/api/log`) that holds the
  client secret as an env var, exchanges it for a token (client-credentials or
  on-behalf-of), and calls the Graph `rows/add` endpoint above.
- Point the app's webhook URL at `/api/log`. The contract in §4 is unchanged.
- The same `token` check applies; also enable CORS for the app origin.

---

## 6. The blank import template (ships in this repo)

`templates/RESUITE Hours Log.xlsx` — the import target / live workbook:

- **TimeLog** sheet: an Excel Table named `TimeLog` with the §4 columns, plus a
  calculated **Points Check** column = `ROUNDUP([@Minutes]/6,0)/10` that must
  equal Points on every row (conditional-format red if it ever doesn't — that
  catches any bad rounding).
- **Summary** sheet: per Client Number totals — Total Points, Total Minutes,
  Entry Count (SUMIF/COUNTIF). No dollar amounts here; rates live in the decoder.

The **decoder** workbook (client names, rates, matter numbers, code→label maps)
is a **separate, access-restricted file** that the app and this workbook never
touch. Its full spec is in `docs/resuite-datasets-prompt.md` (Artifact 2), along
with the document template (Artifact 3) and the field-by-field connection map
(Artifact 4).

For the manual bridge today: open the template, import the exported CSV into the
`TimeLog` table (append rows; do not overwrite), and Copilot reads it.

---

## 7. Privacy contract (applies to everything you build)

| Travels off the phone / over the wire | Stays firm-side only |
|---|---|
| Client number, dates, times, minutes, points, number codes, yes/no | Client names, matter descriptions, locations, emails, what each code means |

Rules: anonymous numbers only on app-facing artifacts; append-only (every send
is its own row, never overwrite or de-dupe); **one-way** (never build anything
that sends data back to the app). If a feature would require sending words,
stop — encode it as a number code and map it on the Copilot/firm side.

---

## 8. Definition of done

- [ ] `RESUITE Hours Log` workbook exists in OneDrive/SharePoint with a `TimeLog`
      table matching §4 and the Points Check formula.
- [ ] Power Automate flow live, parsing `text/plain`, writing rows, returning 200.
- [ ] `token` check rejects unauthorized bodies with 401.
- [ ] POST URL handed to Chelsee and saved in the app (sync chip green).
- [ ] Test entry 14:15–14:48 lands as 33 min / 0.6 pts.
- [ ] Manual CSV bridge documented for fallback.

Questions → Chelsee. Roadmap for the next features (meetings, deadlines, tasks,
reminders, end-of-day rollup) is in `docs/roadmap.md`.
