import express from "express";
import { Review } from "../models/Review.js";
import { Movie } from "../models/Movie.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/:slug/reviews", async (req, res) => {
  const movie = await Movie.findOne({ slug: req.params.slug });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const reviews = await Review.find({ movieId: movie._id }).sort({ createdAt: -1 }).limit(100);
  return res.json(reviews);
});

router.post("/:slug/reviews", requireAuth, async (req, res) => {
  const movie = await Movie.findOne({ slug: req.params.slug });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const review = await Review.create({
    movieId: movie._id,
    userId: req.user.sub,
    rating: req.body.rating,
    content: req.body.content,
  });
  return res.status(201).json(review);
});

export default router;
