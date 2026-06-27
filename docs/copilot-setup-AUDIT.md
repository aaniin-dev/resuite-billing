# RESUITE — Will the setup prompt "clear through" Copilot? (dry-run audit)

Honest assessment of `copilot-setup-prompt.md` run as a single paste into Microsoft
365 Copilot. Bottom line first, then a step-by-step verdict, then the fix.

## Bottom line
**The full prompt will NOT clear through as one automated task.** Microsoft 365
Copilot (the chat) is not an autonomous backend builder. It can help scaffold an
Excel workbook and *draft* flow steps, but it does not create and publish
Power Automate cloud flows end-to-end from a paste — and the core piece the app
needs (the HTTP intake) has a hard blocker: the **"When an HTTP request is
received" trigger is a Premium Power Automate feature** (paid license), and its
**POST URL only exists after a human builds and saves the flow.** So the promise
"paste once, copy the URL, done" overstates what Copilot does today.

## Step-by-step verdict
| Prompt section | Clears in one paste? | Why |
|---|---|---|
| 1. Workbook + TimeLog table, ROUNDUP column, conditional formatting | ⚠️ Partial | Copilot in Excel can build a table, columns, a formula column, and CF on an **open** workbook — but verify the calculated column + the "red if ≠ Points" rule. Creating the file in OneDrive from chat is unreliable; open a blank workbook first. |
| 2. Mapping table + auto-assign Client Number/emoji/color on new App Number | ⚠️ Table yes, logic no | Copilot can make the table. "Generate a new Client Number + next emoji/color when a new App Number appears" is **flow/Office Script logic**, not something a static table does on its own. |
| 3. RESUITE Intake flow (HTTP trigger → parse → lookup → add row → return URL) | ❌ Won't | Copilot chat can't build/publish this. You build it in Power Automate; the HTTP trigger is **Premium**; the **POST URL is generated only after you save the flow**. |
| 4. RESUITE Automation flow (validation, BOD/EOD, weekly, switch-matter-10min, dormant/high-activity/gap alerts, billing packets) | ❌ Won't | These are several separate flows + scheduled triggers + conditions. Not auto-built from a paste. This is a developer build. |
| 5. Outlook auto-emails (BOD/EOD/Friday/alerts/BRB/deadlines) | ❌ Mostly | Standard Outlook connector exists, but each is its own flow — not created automatically from text. |
| 6. Next Meeting → Outlook calendar event | ⚠️ Doable, not automatic | A single standard-connector action — but it's part of the flow build, not magic. |
| 7. Return the POST URL | ❌ | Only exists once section 3 is built + saved. |

## What this means for a customer
If a lawyer pastes the full prompt expecting a link back, they'll get a helpful
outline and maybe a workbook — **not a working URL.** They'll be stuck at the most
important step. That breaks the "one-time, simple" goal.

## The fix — three honest paths
**A. Import-based (truly simple, no flows, no Premium) — recommended for most.**
Skip the HTTP flow. The app already **exports a CSV**; the customer imports it into
the RESUITE Hours Log workbook, and Copilot in Excel reads/summarizes it. Next
meetings: one small **standard** flow (or Copilot on request) creates the Outlook
event + an admin To-Do task. No Premium license, nothing to hand-build beyond one
tiny flow. This matches the export-only model we already built.

**B. Automated, but ship the flow as a template — not a paste.**
Pre-build the Intake (HTTP) + Next-Meeting flow once and export it as a
**Power Automate Solution (.zip)**. The customer **imports the Solution**, connects
their accounts, and copies the URL it exposes. Real one-time setup — but needs a
Premium Power Automate license for the HTTP trigger.

**C. Skip Power Automate entirely (cleanest automation, needs a dev).**
Point the app's Connect URL at our **Vercel `/api`**, which writes to the workbook
via Microsoft Graph. The customer just signs in once with Microsoft; no flows at
all. This reintroduces a small backend holding Graph credentials.

## Recommendation
Lead with **A** for the basic customer (organize + reminders + admin list), and
offer **B** (an importable template) for firms that want full automation. Rewrite
the customer-facing prompt so it only asks Copilot for what it can actually do
(build/sort the workbook, summarize, draft the one small flow), and stop promising
an auto-generated URL from a single paste.
