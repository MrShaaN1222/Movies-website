import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requirePremium } from "../middleware/entitlement.js";
import { OttContent } from "../models/OttContent.js";
import { WatchProgress } from "../models/WatchProgress.js";
import { createUploadIntent, queueTranscodeJob } from "../services/transcoding.service.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const items = await OttContent.find().sort({ createdAt: -1 }).limit(100);
  res.json(items);
});

router.post("/", requireAuth, requireRole(["admin", "creator"]), async (req, res) => {
  const payload = { ...req.body, uploadedBy: req.user.sub };
  const created = await OttContent.create(payload);
  res.status(201).json(created);
});

router.get("/:slug", async (req, res) => {
  const item = await OttContent.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Content not found" });
  return res.json(item);
});

router.post("/upload-intent", requireAuth, requireRole(["admin", "creator"]), async (req, res) => {
  const { fileName } = req.body;
  const intent = await createUploadIntent(fileName);
  return res.json(intent);
});

router.post(
  "/:slug/transcode",
  requireAuth,
  requireRole(["admin", "creator"]),
  async (req, res) => {
    const job = await queueTranscodeJob(req.body.objectKey);
    return res.json(job);
  }
);

router.get("/:slug/playback", requireAuth, requirePremium, async (req, res) => {
  const item = await OttContent.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Content not found" });
  return res.json({ hlsUrl: item.hlsUrl, title: item.title });
});

router.post("/:slug/progress", requireAuth, async (req, res) => {
  const item = await OttContent.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ message: "Content not found" });
  const progress = await WatchProgress.findOneAndUpdate(
    { userId: req.user.sub, ottContentId: item._id },
    {
      seconds: req.body.seconds || 0,
      completed: Boolean(req.body.completed),
      deviceId: req.body.deviceId || "web",
    },
    { upsert: true, new: true }
  );
  return res.json(progress);
});

export default router;
