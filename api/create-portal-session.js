// Opens the Stripe Customer Portal so a subscriber can update payment method,
// view invoices, or cancel. The app POSTs { customerId } and redirects to url.
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { customerId } = req.body || {};
    if (!customerId) return res.status(400).json({ error: "missing customerId" });
    const origin = req.headers.origin || "https://" + req.headers.host;

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: origin + "/",
    });

    res.status(200).json({ url: portal.url });
  } catch (e) {
    console.error("create-portal-session", e);
    res.status(500).json({ error: e.message });
  }
};
