import express from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requirePremium } from "../middleware/entitlement.js";
import { OttContent } from "../models/OttContent.js";
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

router.get("/", async (_req, res) => {
  const items = await OttContent.find().sort({ createdAt: -1 }).limit(100);
  res.json(items);
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
