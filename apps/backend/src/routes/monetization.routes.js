import express from "express";
import crypto from "crypto";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requirePhoneVerified } from "../middleware/requirePhoneVerified.js";
import { AdEvent } from "../models/AdEvent.js";
import { Subscription } from "../models/Subscription.js";
import { env } from "../config/env.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const adEventSchema = z.object({
  eventType: z.string().min(2),
  placement: z.string().optional(),
  movieSlug: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const subscriptionIntentSchema = z.object({
  planCode: z.string().min(2),
  paymentMethod: z.enum(["upi", "card"]).optional(),
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
    const doc = await Subscription.findOneAndUpdate(
      { userId: req.user.sub },
      {
        planCode,
        provider: "razorpay",
        razorpaySubscriptionId: parsed.data.razorpaySubscriptionId,
        razorpayCustomerId: parsed.data.razorpayCustomerId,
      },
      { upsert: true, new: true }
    );
    const methodLabel = paymentMethod === "card" ? "Card" : paymentMethod === "upi" ? "UPI" : "default";
    return res.json({
      message: `Subscription intent stored (${methodLabel}). Payment capture can be activated in Phase 2.`,
      subscription: doc,
      paymentMethod: paymentMethod || null,
    });
  }
);

router.get("/subscriptions/me", requireAuth, async (req, res) => {
  const doc = await Subscription.findOne({ userId: req.user.sub });
  return res.json(doc || { status: "inactive", planCode: null, provider: "razorpay" });
});

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
