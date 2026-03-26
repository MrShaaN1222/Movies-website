import { Subscription } from "../models/Subscription.js";

export async function requirePremium(req, res, next) {
  const sub = await Subscription.findOne({ userId: req.user.sub, status: "active" });
  if (!sub) return res.status(402).json({ message: "Premium subscription required" });
  return next();
}
