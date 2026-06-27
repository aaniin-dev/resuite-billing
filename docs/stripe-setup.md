# RESUITE — Stripe subscription setup

RESUITE now has a recurring-subscription layer: firms subscribe to use the app.
The static app stays as-is; Stripe runs through small serverless functions in
`/api` that deploy automatically on Vercel. **Stripe is the source of truth** for
who's subscribed — there's no separate database to maintain.

## What's in the repo
- `api/create-checkout-session.js` — starts a subscription Checkout, returns its URL
- `api/checkout-session.js` — reads the session after Stripe redirects back
- `api/subscription-status.js` — live "is this customer active?" check (the gate)
- `api/create-portal-session.js` — opens the Stripe customer portal (manage/cancel)
- `api/webhook.js` — optional; for future DB sync or emails
- `.env.example` — the environment variables to set
- In-app: a pricing/subscribe sheet and "Manage billing" under ⚙ Settings

## One-time setup (you do this — needs your Stripe login)

1. **Create the product + price**
   Stripe Dashboard → Product catalog → **Add product** (e.g. "RESUITE Pro") →
   add a **recurring** price (e.g. $29 / month) → copy the **price ID** (`price_…`).
   Keep the app's display price (`PLAN` in `index.html`) in sync with this.

2. **Get your secret key**
   Dashboard → Developers → API keys → copy the **Secret key** (`sk_test_…` while
   testing, `sk_live_…` for real charges).

3. **Set environment variables in Vercel**
   Vercel project → Settings → Environment Variables (see `.env.example`):
   - `STRIPE_SECRET_KEY` = your secret key
   - `STRIPE_PRICE_ID` = the recurring price ID
   - `STRIPE_TRIAL_DAYS` = e.g. `14` (optional; remove for no trial)
   - `STRIPE_WEBHOOK_SECRET` = only if you enable the webhook (step 5)
   Redeploy so the functions pick them up.

4. **Turn on the customer portal**
   Dashboard → Settings → Billing → Customer portal → activate (lets subscribers
   update cards, see invoices, and cancel).

5. **(Optional) Webhook**
   Dashboard → Developers → Webhooks → Add endpoint →
   `https://YOURAPP.vercel.app/api/webhook` → select the
   `customer.subscription.*` and `checkout.session.completed` events → copy the
   signing secret into `STRIPE_WEBHOOK_SECRET`. Not required for v1 because the
   app checks status live; add it when you want to persist status or send emails.

## How it flows
1. User opens ⚙ Settings → **Subscribe to RESUITE** → enters billing email →
   the app calls `create-checkout-session` and redirects to Stripe Checkout.
2. After paying, Stripe returns to `…/?checkout=success&session_id=…`; the app
   calls `checkout-session`, stores the `customerId`, and marks the subscription
   active.
3. On later loads, the app calls `subscription-status` to re-confirm. **Manage
   billing** opens the Stripe portal.

## Testing
- Use **test mode** keys + Stripe's test card `4242 4242 4242 4242`, any future
  expiry, any CVC.
- The subscribe/portal buttons only work on the deployed Vercel site (the `/api`
  functions don't exist on the local static preview — they fall back to a toast).

## Enforcing the paywall (when you're ready)
Right now the app shows the subscribe option but does not lock the timer, so
testing isn't blocked. To hard-gate, check `state.billing.active` before allowing
tracking and show the pricing sheet when it's false — say the word and I'll wire
that in.

## Going live
Swap the Vercel env vars to live keys (`sk_live_…`, a live `price_…`), re-add the
webhook in live mode, and redeploy. Nothing else changes.
