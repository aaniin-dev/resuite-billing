// Creates a Stripe Checkout Session in subscription mode and returns its URL.
// The app POSTs { email? } and redirects the browser to the returned url.
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { email } = req.body || {};
    const origin = req.headers.origin || "https://" + req.headers.host;
    const trial = process.env.STRIPE_TRIAL_DAYS ? parseInt(process.env.STRIPE_TRIAL_DAYS, 10) : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email || undefined,
      allow_promotion_codes: true,
      subscription_data: trial ? { trial_period_days: trial } : undefined,
      success_url: origin + "/?checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/?checkout=cancel",
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("create-checkout-session", e);
    res.status(500).json({ error: e.message });
  }
};
