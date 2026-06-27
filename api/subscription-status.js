// Live subscription check by customerId. The app calls this on load to gate
// access without needing its own database — Stripe is the source of truth.
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  try {
    const customerId = req.query.customerId;
    if (!customerId) return res.status(400).json({ error: "missing customerId" });

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    const current = subs.data.find((s) => ["active", "trialing", "past_due"].includes(s.status));

    res.status(200).json({
      active: !!(current && ["active", "trialing"].includes(current.status)),
      status: current ? current.status : "none",
      periodEnd: current ? current.current_period_end : null,
    });
  } catch (e) {
    console.error("subscription-status", e);
    res.status(500).json({ error: e.message });
  }
};
