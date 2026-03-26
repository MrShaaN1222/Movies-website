import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Movie } from "../models/Movie.js";
import { FreeVideo } from "../models/FreeVideo.js";

const router = express.Router();

router.use(requireAuth, requireRole(["admin"]));

router.get("/analytics/overview", async (_req, res) => {
  const [users, movies, freeVideos] = await Promise.all([
    User.countDocuments(),
    Movie.countDocuments(),
    FreeVideo.countDocuments(),
  ]);
  res.json({ users, movies, freeVideos });
});

router.get("/users", async (_req, res) => res.json(await User.find().limit(100)));

export default router;
