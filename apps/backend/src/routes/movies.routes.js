import express from "express";
import { Movie } from "../models/Movie.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { MovieContinue } from "../models/MovieContinue.js";

const router = express.Router();

router.get("/favorites", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub).select("favorites");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ slugs: Array.isArray(user.favorites) ? user.favorites : [] });
});

router.get("/favorites/:slug/status", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub).select("favorites");
  if (!user) return res.status(404).json({ message: "User not found" });
  const inFavorites = (user.favorites || []).includes(req.params.slug);
  return res.json({ inFavorites });
});

router.post("/favorites/:slug", requireAuth, async (req, res) => {
  const movie = await Movie.findOne({ slug: req.params.slug }).select("_id slug");
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const user = await User.findByIdAndUpdate(req.user.sub, { $addToSet: { favorites: movie.slug } }, { new: true }).select("favorites");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ inFavorites: true, favoritesCount: (user.favorites || []).length });
});

router.delete("/favorites/:slug", requireAuth, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.sub, { $pull: { favorites: req.params.slug } }, { new: true }).select("favorites");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ inFavorites: false, favoritesCount: (user.favorites || []).length });
});

router.get("/continue", requireAuth, async (req, res) => {
  const rows = await MovieContinue.find({ userId: req.user.sub }).sort({ updatedAt: -1 }).limit(24);
  const slugs = rows.map((row) => row.movieSlug).filter(Boolean);
  if (slugs.length === 0) return res.json([]);
  const movies = await Movie.find({ slug: { $in: slugs } });
  const bySlug = new Map(movies.map((movie) => [movie.slug, movie]));
  const items = slugs
    .map((slug) => bySlug.get(slug))
    .filter(Boolean);
  return res.json(items);
});

router.post("/continue/:slug", requireAuth, async (req, res) => {
  const movie = await Movie.findOne({ slug: req.params.slug }).select("slug");
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const row = await MovieContinue.findOneAndUpdate(
    { userId: req.user.sub, movieSlug: movie.slug },
    { $set: { movieSlug: movie.slug } },
    { upsert: true, new: true }
  );
  return res.json({ ok: true, movieSlug: row.movieSlug, updatedAt: row.updatedAt });
});

router.get("/trending", async (_req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 }).limit(20);
  res.json(movies);
});

router.get("/popular", async (_req, res) => {
  const movies = await Movie.find().sort({ "ratings.tmdb": -1 }).limit(20);
  res.json(movies);
});

router.get("/upcoming", async (_req, res) => {
  const movies = await Movie.find().sort({ releaseDate: 1 }).limit(20);
  res.json(movies);
});

router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  const movies = await Movie.find({ $text: { $search: q } }).limit(25);
  return res.json(movies);
});

router.get("/:slug", async (req, res) => {
  const movie = await Movie.findOne({ slug: req.params.slug });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  return res.json(movie);
});

export default router;
