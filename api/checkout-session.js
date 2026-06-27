// Reads a completed Checkout Session (called once after Stripe redirects back),
// so the app can store the customerId and confirm the subscription is active.
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) return res.status(400).json({ error: "missing session_id" });

    const s = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    const sub = s.subscription;
    const status = sub && typeof sub === "object" ? sub.status : null;

    res.status(200).json({
      customerId: typeof s.customer === "string" ? s.customer : s.customer && s.customer.id,
      email: s.customer_details && s.customer_details.email,
      status: status || "none",
      active: status ? ["active", "trialing"].includes(status) : false,
    });
  } catch (e) {
    console.error("checkout-session", e);
    res.status(500).json({ error: e.message });
  }
};
