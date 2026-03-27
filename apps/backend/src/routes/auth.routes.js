import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000;
/** @type {Map<string, { code: string; expiresAt: number }>} */
const phoneOtpStore = new Map();

function normalizeIndiaMobile(input) {
  if (!input || typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  let rest = digits;
  if (rest.startsWith("91") && rest.length === 12) rest = rest.slice(2);
  if (rest.length !== 10 || !/^[6-9]\d{9}$/.test(rest)) return null;
  return `+91${rest}`;
}

function otpKey(userId, phone) {
  return `${String(userId)}:${phone}`;
}

function publicUserPayload(user) {
  return {
    id: user._id,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.phone || "",
    phoneVerified: Boolean(user.phoneVerified),
    accountStatus: user.accountStatus || "active",
    deactivatedAt: user.deactivatedAt || null,
  };
}

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub).select(
    "name email phone phoneVerified role accountStatus deactivatedAt"
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user: publicUserPayload(user) });
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  return res.status(201).json({ id: user._id, email: user.email });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  if (user.accountStatus === "deactivated") {
    return res.status(403).json({ message: "Account is temporarily deactivated. Contact support to reactivate." });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ sub: user._id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  return res.json({
    token,
    user: publicUserPayload(user),
  });
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});

router.patch("/profile", requireAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid profile payload" });
  }

  const payload = parsed.data;
  if (!payload.name && !payload.email) {
    return res.status(400).json({ message: "No profile fields to update" });
  }

  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (payload.email && payload.email !== user.email) {
    const exists = await User.findOne({ email: payload.email, _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ message: "Email already exists" });
    user.email = payload.email;
  }

  if (payload.name) {
    user.name = payload.name;
  }

  await user.save();
  return res.json({ message: "Profile updated", user: publicUserPayload(user) });
});

const secureActionSchema = z.object({
  password: z.string().min(6),
});

router.post("/deactivate", requireAuth, rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {
  const parsed = secureActionSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Password is required" });
  }

  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: "User not found" });
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid password" });

  user.accountStatus = "deactivated";
  user.deactivatedAt = new Date();
  await user.save();
  return res.json({ message: "Account deactivated successfully." });
});

router.delete("/account", requireAuth, rateLimit({ windowMs: 60_000, max: 5 }), async (req, res) => {
  const parsed = secureActionSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Password is required" });
  }

  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: "User not found" });
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid password" });

  await User.deleteOne({ _id: user._id });
  return res.json({ message: "Account permanently deleted." });
});

const phoneRequestSchema = z.object({
  phone: z.string().min(8),
});

router.post(
  "/phone/request-otp",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 5 }),
  async (req, res) => {
    const parsed = phoneRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid phone" });
    const phone = normalizeIndiaMobile(parsed.data.phone);
    if (!phone) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number." });
    }

    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.phoneVerified && user.phone && user.phone === phone) {
      return res.json({ message: "This number is already verified on your account." });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const key = otpKey(user._id, phone);
    phoneOtpStore.set(key, { code, expiresAt: Date.now() + OTP_TTL_MS });

    const payload = {
      message: "OTP sent to your mobile number.",
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    };
    if (env.NODE_ENV !== "production") {
      payload.devOtp = code;
    }
    return res.json(payload);
  }
);

const phoneVerifySchema = z.object({
  phone: z.string().min(8),
  code: z.string().min(4).max(8),
});

router.post("/phone/verify-otp", requireAuth, rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  const parsed = phoneVerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid verification payload" });
  const phone = normalizeIndiaMobile(parsed.data.phone);
  if (!phone) {
    return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number." });
  }

  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: "User not found" });

  const key = otpKey(user._id, phone);
  const entry = phoneOtpStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP expired or not found. Request a new code." });
  }
  if (entry.code !== parsed.data.code.trim()) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  phoneOtpStore.delete(key);
  user.phone = phone;
  user.phoneVerified = true;
  await user.save();

  return res.json({ message: "Mobile number verified.", user: publicUserPayload(user) });
});

router.post("/refresh", (_req, res) => res.json({ message: "refresh endpoint scaffolded" }));
router.post("/logout", (_req, res) => res.json({ message: "logout endpoint scaffolded" }));

export default router;
