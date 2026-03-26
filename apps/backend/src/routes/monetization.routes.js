import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { AdEvent } from "../models/AdEvent.js";
import { Subscription } from "../models/Subscription.js";

const router = express.Router();

router.post("/ads/events", async (req, res) => {
  const event = await AdEvent.create(req.body);
  return res.status(201).json(event);
});

router.post("/subscriptions/intent", requireAuth, async (req, res) => {
  const { planCode } = req.body;
  const doc = await Subscription.findOneAndUpdate(
    { userId: req.user.sub },
    { planCode, provider: "razorpay" },
    { upsert: true, new: true }
  );
  return res.json({
    message: "Subscription intent stored. Activate payment capture in Phase 2.",
    subscription: doc,
  });
});

router.post("/subscriptions/webhook/razorpay", async (_req, res) => {
  return res.json({ message: "Webhook endpoint scaffolded for Phase 2 activation." });
});

export default router;
