import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import Stripe from "stripe";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requirePhoneVerified } from "../middleware/requirePhoneVerified.js";
import { AdEvent } from "../models/AdEvent.js";
import { Subscription } from "../models/Subscription.js";
import { env } from "../config/env.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

/** Amounts in paise; must stay in sync with frontend checkout plans. */
const PLAN_PRICES_PAISE = {
  "premium-monthly": 9900,
  "premium-yearly": 49900,
};

const PLAN_PRICES_INR = {
  "premium-monthly": 99,
  "premium-yearly": 499,
};

const PLAN_DURATIONS_DAYS = {
  "premium-monthly": 30,
  "premium-yearly": 365,
};

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function inferPeriodEnd(subscription) {
  if (!subscription) return undefined;
  if (subscription.currentPeriodEnd) return subscription.currentPeriodEnd;
  const duration = PLAN_DURATIONS_DAYS[subscription.planCode];
  if (!duration) return undefined;
  const start = subscription.planStartedAt || subscription.updatedAt || subscription.createdAt;
  if (!start) return undefined;
  return addDays(new Date(start), duration);
}

function buildPlanHistoryPatch(existing, nextPlanCode) {
  if (!existing?.planCode || existing.planCode === nextPlanCode) return {};
  return {
    previousPlanCode: existing.planCode,
    previousProvider: existing.provider || undefined,
    previousStatus: existing.status === "active" ? "replaced" : existing.status || undefined,
    previousPeriodEnd: inferPeriodEnd(existing),
  };
}

const adEventSchema = z.object({
  eventType: z.string().min(2),
  placement: z.string().optional(),
  movieSlug: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const subscriptionIntentSchema = z.object({
  planCode: z.string().min(2),
  paymentMethod: z.enum(["upi", "card", "stripe"]).optional(),
  razorpaySubscriptionId: z.string().optional(),
  razorpayCustomerId: z.string().optional(),
});

router.post("/ads/events", rateLimit({ windowMs: 60_000, max: 120 }), async (req, res) => {
  const parsed = adEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid ad event payload" });
  const event = await AdEvent.create(parsed.data);
  return res.status(201).json(event);
});

router.post(
  "/subscriptions/intent",
  requireAuth,
  requirePhoneVerified,
  rateLimit({ windowMs: 60_000, max: 15 }),
  async (req, res) => {
    const parsed = subscriptionIntentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid subscription payload" });
    const { planCode, paymentMethod } = parsed.data;
    const existing = await Subscription.findOne({ userId: req.user.sub });
    const doc = await Subscription.findOneAndUpdate(
      { userId: req.user.sub },
      {
        ...buildPlanHistoryPatch(existing, planCode),
        planCode,
        provider: "razorpay",
        razorpaySubscriptionId: parsed.data.razorpaySubscriptionId,
        razorpayCustomerId: parsed.data.razorpayCustomerId,
      },
      { upsert: true, new: true }
    );
    const methodPhrase = paymentMethod === "card" ? "card" : paymentMethod === "upi" ? "UPI" : paymentMethod === "stripe" ? "Stripe" : "payment";
    return res.json({
      message: `Thanks — your Mirai Gold plan and ${methodPhrase} choice are saved. You’ll get full access once payment is confirmed.`,
      subscription: doc,
      paymentMethod: paymentMethod || null,
    });
  }
);

router.get("/subscriptions/me", requireAuth, async (req, res) => {
  const doc = await Subscription.findOne({ userId: req.user.sub });
  return res.json(doc || { status: "inactive", planCode: null, provider: "razorpay" });
});

router.get("/subscriptions/payment-status", requireAuth, (_req, res) => {
  const razorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY);
  return res.json({
    razorpayConfigured,
    keyId: razorpayConfigured ? env.RAZORPAY_KEY_ID : null,
    stripeConfigured,
  });
});

router.post(
  "/subscriptions/create-order",
  requireAuth,
  requirePhoneVerified,
  rateLimit({ windowMs: 60_000, max: 20 }),
  async (req, res) => {
    const parsed = z
      .object({
        planCode: z.string().min(2),
        paymentMethod: z.enum(["upi", "card", "stripe"]).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid order payload" });

    const { planCode } = parsed.data;
    const amount = PLAN_PRICES_PAISE[planCode];
    if (!amount) return res.status(400).json({ message: "Unknown plan code" });

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        code: "PAYMENT_NOT_CONFIGURED",
        message: "Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        planCode,
        amount,
        amountInr: PLAN_PRICES_INR[planCode],
      });
    }

    const razorpay = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
    const receipt = `mg_${String(req.user.sub).slice(-10)}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: { planCode, userId: String(req.user.sub) },
    });

    return res.json({
      keyId: env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount,
      currency: "INR",
      planCode,
      amountInr: PLAN_PRICES_INR[planCode],
    });
  }
);

router.post(
  "/subscriptions/create-stripe-checkout-session",
  requireAuth,
  requirePhoneVerified,
  rateLimit({ windowMs: 60_000, max: 20 }),
  async (req, res) => {
    const parsed = z
      .object({
        planCode: z.string().min(2),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid Stripe checkout payload" });

    const { planCode } = parsed.data;
    const amount = PLAN_PRICES_PAISE[planCode];
    if (!amount) return res.status(400).json({ message: "Unknown plan code" });
    if (!env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        code: "STRIPE_NOT_CONFIGURED",
        message: "Stripe is not configured. Add STRIPE_SECRET_KEY.",
        planCode,
        amountInr: PLAN_PRICES_INR[planCode],
      });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: amount,
            product_data: {
              name: `Mirai Gold — ${planCode === "premium-monthly" ? "Premium Monthly" : "Premium Yearly"}`,
            },
          },
        },
      ],
      metadata: {
        planCode,
        userId: String(req.user.sub),
      },
      success_url: `${env.FRONTEND_URL}/purchase?plan=${encodeURIComponent(planCode)}&method=stripe&stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/purchase?plan=${encodeURIComponent(planCode)}&method=stripe&stripe=cancelled`,
    });

    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      planCode,
      amountInr: PLAN_PRICES_INR[planCode],
    });
  }
);

router.get(
  "/subscriptions/stripe-session-status",
  requireAuth,
  requirePhoneVerified,
  rateLimit({ windowMs: 60_000, max: 30 }),
  async (req, res) => {
    const sessionId = String(req.query.sessionId || "");
    if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });
    if (!env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session?.metadata?.userId && session.metadata.userId !== String(req.user.sub)) {
      return res.status(403).json({ message: "Session does not belong to current user" });
    }

    const planCode = session?.metadata?.planCode;
    if (!planCode || !PLAN_PRICES_PAISE[planCode]) {
      return res.status(400).json({ message: "Invalid Stripe session metadata" });
    }

    const isPaid = session.payment_status === "paid";
    if (!isPaid) {
      return res.json({ paid: false, status: session.payment_status || "unpaid", planCode });
    }

    const existing = await Subscription.findOne({ userId: req.user.sub });
    const startedAt = new Date();
    const currentPeriodEnd = addDays(startedAt, PLAN_DURATIONS_DAYS[planCode] || 30);
    const doc = await Subscription.findOneAndUpdate(
      { userId: req.user.sub },
      {
        ...buildPlanHistoryPatch(existing, planCode),
        planCode,
        provider: "stripe",
        status: "active",
        planStartedAt: startedAt,
        currentPeriodEnd,
      },
      { upsert: true, new: true }
    );

    return res.json({
      paid: true,
      status: session.payment_status,
      planCode,
      message: "Stripe payment successful. Mirai Gold is active on your account.",
      subscription: doc,
    });
  }
);

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(2),
  razorpay_payment_id: z.string().min(2),
  razorpay_signature: z.string().min(2),
  planCode: z.string().min(2),
});

router.post(
  "/subscriptions/verify-payment",
  requireAuth,
  requirePhoneVerified,
  rateLimit({ windowMs: 60_000, max: 30 }),
  async (req, res) => {
    const parsed = verifyPaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid verification payload" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planCode } = parsed.data;
    if (!PLAN_PRICES_PAISE[planCode]) return res.status(400).json({ message: "Unknown plan code" });

    if (!env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ message: "Payment gateway not configured" });
    }

    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const existing = await Subscription.findOne({ userId: req.user.sub });
    const startedAt = new Date();
    const currentPeriodEnd = addDays(startedAt, PLAN_DURATIONS_DAYS[planCode] || 30);
    const doc = await Subscription.findOneAndUpdate(
      { userId: req.user.sub },
      {
        ...buildPlanHistoryPatch(existing, planCode),
        planCode,
        provider: "razorpay",
        status: "active",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        planStartedAt: startedAt,
        currentPeriodEnd,
      },
      { upsert: true, new: true }
    );

    return res.json({
      message: "Payment successful. Mirai Gold is active on your account.",
      subscription: doc,
    });
  }
);

router.post("/subscriptions/webhook/razorpay", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ message: "Missing Razorpay signature" });
  }
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    return res.status(500).json({ message: "RAZORPAY_WEBHOOK_SECRET is not configured" });
  }

  const rawBody = req.rawBody || JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  if (expected !== signature) {
    return res.status(401).json({ message: "Invalid webhook signature" });
  }

  const event = req.body?.event;
  const payload = req.body?.payload?.subscription?.entity;
  const subscriptionId = payload?.id;
  const customerId = payload?.customer_id;
  const periodEndUnix = payload?.current_end;

  if (!subscriptionId) {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  let status = "inactive";
  if (event === "subscription.activated" || event === "subscription.charged") status = "active";
  if (event === "subscription.cancelled") status = "cancelled";
  if (event === "subscription.pending") status = "past_due";

  const updated = await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscriptionId },
    {
      status,
      razorpayCustomerId: customerId || undefined,
      currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : undefined,
    },
    { new: true }
  );

  return res.json({ ok: true, subscription: updated || null });
});

export default router;
