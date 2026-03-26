import express from "express";
import { FreeVideo } from "../models/FreeVideo.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const category = req.query.category ? { category: req.query.category } : {};
  const videos = await FreeVideo.find(category).sort({ createdAt: -1 }).limit(100);
  res.json(videos);
});

router.get("/:id", async (req, res) => {
  const video = await FreeVideo.findById(req.params.id);
  if (!video) return res.status(404).json({ message: "Free video not found" });
  return res.json(video);
});

export default router;
