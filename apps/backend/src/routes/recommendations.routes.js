import express from "express";
import { Movie } from "../models/Movie.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = express.Router();

router.post("/query", async (req, res) => {
  const prompt = String(req.body.prompt || "");
  const tokens = prompt.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return res.json([]);
  const query = tokens.join(" ");
  const movies = await Movie.find({ $text: { $search: query } }).limit(12);
  return res.json({ prompt, results: movies });
});

router.get("/personalized", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub);
  const likedGenres = [];
  const sample = await Movie.find().limit(30);
  for (const m of sample) {
    for (const g of m.genres || []) {
      if (!likedGenres.includes(g)) likedGenres.push(g);
    }
  }
  const results = await Movie.find({ genres: { $in: likedGenres.slice(0, 3) } }).limit(20);
  return res.json({ userId: user?._id, results });
});

export default router;
