import express from "express";
import { Movie } from "../models/Movie.js";

const router = express.Router();

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
