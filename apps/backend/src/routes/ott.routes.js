import express from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { OttContent } from "../models/OttContent.js";
import { Subscription } from "../models/Subscription.js";
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

const FALLBACK_OTT_ITEMS = [
  {
    _id: "o1",
    slug: "mirai-original-the-last-signal",
    title: "Mirai Original: The Last Signal",
    type: "exclusive",
    description: "A deep-space rescue mystery spanning eight episodes.",
    posterUrl: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    isPremium: true,
    isAdult: false,
    contentRating: "U/A 13+",
  },
  {
    _id: "o2",
    slug: "mirai-original-shadow-city",
    title: "Mirai Original: Shadow City",
    type: "exclusive",
    description: "A detective drama set in a hyper-connected metropolis.",
    posterUrl: "https://image.tmdb.org/t/p/w780/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
    hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    isPremium: true,
    isAdult: true,
    contentRating: "A 18+",
  },
  {
    _id: "o3",
    slug: "mirai-spotlight-midnight-run",
    title: "Mirai Spotlight: Midnight Run",
    type: "short-film",
    description: "A kinetic short film about one night that changes everything.",
    posterUrl: "https://image.tmdb.org/t/p/w780/caQp2MhwlkJ3V9D4Tr5kL5M4u9Y.jpg",
    hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    isPremium: true,
    isAdult: false,
    contentRating: "U",
  },
  {
    _id: "o4",
    slug: "mirai-masterclass-cinema-lighting",
    title: "Mirai Masterclass: Cinema Lighting",
    type: "course",
    description: "Learn how cinematographers sculpt light for story and mood.",
    posterUrl: "https://image.tmdb.org/t/p/w780/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    isPremium: false,
    isAdult: false,
    contentRating: "U",
  },
];

function findFallbackOttBySlug(slug) {
  return FALLBACK_OTT_ITEMS.find((item) => item.slug === slug) || null;
}

async function findOttItemBySlug(slug) {
  const fromDb = await OttContent.findOne({ slug });
  return fromDb || findFallbackOttBySlug(slug);
}

function isPersistedOttItem(item) {
  return Boolean(item?._id && typeof item._id !== "string");
}

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
  return slugs
    .map((slug) => {
      const fromDb = bySlug.get(slug);
      if (fromDb) return fromDb;
      return findFallbackOttBySlug(slug);
    })
    .filter(Boolean);
}

router.get("/", async (_req, res) => {
  const items = await OttContent.find().sort({ createdAt: -1 }).limit(100);
  if (!items.length) return res.json(FALLBACK_OTT_ITEMS);
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
  const content = await findOttItemBySlug(req.params.slug);
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
  const item = await findOttItemBySlug(req.params.slug);
  if (!item) return res.status(404).json({ message: "Content not found" });
  if (!isPersistedOttItem(item)) {
    const progress = await WatchProgress.findOne({ userId: req.user.sub, ottSlug: item.slug });
    return res.json(progress || { seconds: 0, completed: false, deviceId: "web" });
  }
  const progress = await WatchProgress.findOne({ userId: req.user.sub, ottContentId: item._id });
  return res.json(progress || { seconds: 0, completed: false, deviceId: "web" });
});

router.get("/progress/continue", requireAuth, async (req, res) => {
  const rows = await WatchProgress.find({ userId: req.user.sub, completed: false })
    .sort({ updatedAt: -1 })
    .limit(12)
    .populate("ottContentId");

  const items = rows
    .filter((row) => row.ottContentId || row.ottSlug)
    .map((row) => ({
      progressId: row._id,
      seconds: row.seconds,
      updatedAt: row.updatedAt,
      content: row.ottContentId || findFallbackOttBySlug(row.ottSlug),
    }));

  return res.json(items.filter((row) => row.content));
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

router.get("/:slug/playback", requireAuth, async (req, res) => {
  const item = await findOttItemBySlug(req.params.slug);
  if (!item) return res.status(404).json({ message: "Content not found" });
  if (item.isPremium !== false) {
    const sub = await Subscription.findOne({ userId: req.user.sub, status: "active" });
    if (!sub) return res.status(402).json({ message: "Premium subscription required" });
  }
  const signedHlsUrl = createSignedPlaybackUrl(item.hlsUrl, env.PLAYBACK_SIGNING_SECRET);
  return res.json({ hlsUrl: signedHlsUrl, title: item.title });
});

router.post("/:slug/progress", requireAuth, async (req, res) => {
  const parsed = progressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid progress payload" });
  const data = parsed.data;
  const item = await findOttItemBySlug(req.params.slug);
  if (!item) return res.status(404).json({ message: "Content not found" });
  if (!isPersistedOttItem(item)) {
    const progress = await WatchProgress.findOneAndUpdate(
      { userId: req.user.sub, ottSlug: item.slug },
      { seconds: data.seconds, completed: data.completed, deviceId: data.deviceId },
      { upsert: true, new: true }
    );
    return res.json(progress);
  }
  const progress = await WatchProgress.findOneAndUpdate(
    { userId: req.user.sub, ottContentId: item._id },
    { seconds: data.seconds, completed: data.completed, deviceId: data.deviceId },
    { upsert: true, new: true }
  );
  return res.json(progress);
});

router.get("/:slug", async (req, res) => {
  const item = await findOttItemBySlug(req.params.slug);
  if (!item) return res.status(404).json({ message: "Content not found" });
  return res.json(item);
});

export default router;
