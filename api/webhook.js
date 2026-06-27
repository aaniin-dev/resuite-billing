// Stripe webhook (OPTIONAL for v1 — the app already checks status live via
// subscription-status). Wire it up once you add a database to persist status,
// or to trigger emails. It verifies the signature against the raw request body.
//
// NOTE: this needs the RAW body. On plain Vercel Node functions the stream is
// read manually below. If you move this into a Next.js API route instead, also
// add:  export const config = { api: { bodyParser: false } }
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : await readRaw(req);
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("webhook signature failed", e.message);
    return res.status(400).send("Webhook Error: " + e.message);
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // TODO: persist subscription status to your store when a DB is added.
      console.log("stripe event:", event.type);
      break;
    default:
      break;
  }

  res.status(200).json({ received: true });
};
