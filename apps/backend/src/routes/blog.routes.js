import express from "express";

const router = express.Router();

const posts = [
  {
    slug: "top-10-movies-on-netflix-2026",
    title: "Top 10 Movies on Netflix 2026",
    excerpt: "Curated picks to maximize your watchlist this year.",
    sponsored: false,
  },
];

router.get("/posts", (_req, res) => res.json(posts));

router.get("/posts/:slug", (req, res) => {
  const post = posts.find((p) => p.slug === req.params.slug);
  if (!post) return res.status(404).json({ message: "Post not found" });
  return res.json(post);
});

export default router;
