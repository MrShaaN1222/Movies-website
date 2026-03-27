import express from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requirePremium } from "../middleware/entitlement.js";
import { OttContent } from "../models/OttContent.js";
import { User } from "../models/User.js";
import { WatchProgress } from "../models/WatchProgress.js";
import {
  createSignedPlaybackUrl,
  createUploadIntent,
  queueTranscodeJob,
} from "../services/transcoding.service.js";
import { env } from "../config/env.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const createContentSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  type: z.enum(["short-film", "course", "exclusive"]),
  description: z.string().optional(),
  posterUrl: z.string().url().optional(),
  hlsUrl: z.string().url().optional(),
  isPremium: z.boolean().optional(),
  isAdult: z.boolean().optional(),
  contentRating: z.string().optional(),
});

const uploadIntentSchema = z.object({
  fileName: z.string().min(3),
});

const transcodeSchema = z.object({
  objectKey: z.string().min(3),
});

const progressSchema = z.object({
  seconds: z.number().int().min(0).default(0),
  completed: z.boolean().optional().default(false),
  deviceId: z.string().min(2).optional().default("web"),
});

async function loadWatchlistItems(userId) {
  const user = await User.findById(userId).select("watchlist");
  if (!user) return null;
  const slugs = Array.isArray(user.watchlist) ? user.watchlist : [];
  if (slugs.length === 0) return [];
  const items = await OttContent.find({ slug: { $in: slugs } });
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  return slugs.map((slug) => bySlug.get(slug)).filter(Boolean);
}

router.get("/", async (_req, res) => {
  const items = await OttContent.find().sort({ createdAt: -1 }).limit(100);
  res.json(items);
});

router.get("/watchlist", requireAuth, async (req, res) => {
  const items = await loadWatchlistItems(req.user.sub);
  if (items === null) return res.status(404).json({ message: "User not found" });
  return res.json(items);
});

router.get("/watchlist/:slug/status", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub).select("watchlist");
  if (!user) return res.status(404).json({ message: "User not found" });
  const inWatchlist = (user.watchlist || []).includes(req.params.slug);
  return res.json({ inWatchlist });
});

router.post("/watchlist/:slug", requireAuth, async (req, res) => {
  const content = await OttContent.findOne({ slug: req.params.slug }).select("_id slug");
  if (!content) return res.status(404).json({ message: "Content not found" });
  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { $addToSet: { watchlist: content.slug } },
    { new: true }
  ).select("watchlist");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ inWatchlist: true, watchlistCount: (user.watchlist || []).length });
});

router.delete("/watchlist/:slug", requireAuth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { $pull: { watchlist: req.params.slug } },
    { new: true }
  ).select("watchlist");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ inWatchlist: false, watchlistCount: (user.watchlist || []).length });
});

router.post("/", requireAuth, requireRole(["admin", "creator"]), async (req, res) => {
  const parsed = createContentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid content payload" });
  const payload = { ...parsed.data, uploadedBy: req.user.sub };
  const created = await OttContent.create(payload);
  res.status(201).json(created);
});

router.post(
  "/upload-intent",
  requireAuth,
  requireRole(["admin", "creator"]),
  rateLimit({ windowMs: 60_000, max: 20 }),
  async (req, res) => {
    const parsed = uploadIntentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid upload request" });
    const intent = await createUploadIntent(parsed.data.fileName);
    return res.json(intent);
  }
);

router.get("/:slug/progress", requireAuth, async (req, res) => {
  const item = await OttContent.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Content not found" });
  const progress = await WatchProgress.findOne({ userId: req.user.sub, ottContentId: item._id });
  return res.json(progress || { seconds: 0, completed: false, deviceId: "web" });
});

router.get("/progress/continue", requireAuth, async (req, res) => {
  const rows = await WatchProgress.find({ userId: req.user.sub, completed: false })
    .sort({ updatedAt: -1 })
    .limit(12)
    .populate("ottContentId");

  const items = rows
    .filter((row) => row.ottContentId)
    .map((row) => ({
      progressId: row._id,
      seconds: row.seconds,
      updatedAt: row.updatedAt,
      content: row.ottContentId,
    }));

  return res.json(items);
});

router.post(
  "/:slug/transcode",
  requireAuth,
  requireRole(["admin", "creator"]),
  rateLimit({ windowMs: 60_000, max: 15 }),
  async (req, res) => {
    const parsed = transcodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid transcode request" });
    const job = await queueTranscodeJob(parsed.data.objectKey);
    return res.json(job);
  }
);

router.get("/:slug/playback", requireAuth, requirePremium, async (req, res) => {
  const item = await OttContent.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Content not found" });
  const signedHlsUrl = createSignedPlaybackUrl(item.hlsUrl, env.PLAYBACK_SIGNING_SECRET);
  return res.json({ hlsUrl: signedHlsUrl, title: item.title });
});

router.post("/:slug/progress", requireAuth, async (req, res) => {
  const parsed = progressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid progress payload" });
  const data = parsed.data;
  const item = await OttContent.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Content not found" });
  const progress = await WatchProgress.findOneAndUpdate(
    { userId: req.user.sub, ottContentId: item._id },
    { seconds: data.seconds, completed: data.completed, deviceId: data.deviceId },
    { upsert: true, new: true }
  );
  return res.json(progress);
});

router.get("/:slug", async (req, res) => {
  const item = await OttContent.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Content not found" });
  return res.json(item);
});

export default router;
