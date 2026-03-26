import express from "express";
import crypto from "crypto";
import { Movie } from "../models/Movie.js";
import { AffiliateClick } from "../models/AffiliateClick.js";

const router = express.Router();

router.get("/:slug/watch-providers", async (req, res) => {
  const movie = await Movie.findOne({ slug: req.params.slug }, { providers: 1, slug: 1 });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  return res.json(movie.providers || []);
});

router.post("/affiliate/click", async (req, res) => {
  const { movieSlug, provider, targetUrl, sourcePage } = req.body;
  const code = crypto.randomBytes(6).toString("hex");
  await AffiliateClick.create({ code, movieSlug, provider, targetUrl, sourcePage });
  return res.status(201).json({ redirectPath: `/r/${code}` });
});

router.get("/r/:code", async (req, res) => {
  const click = await AffiliateClick.findOne({ code: req.params.code });
  if (!click) return res.status(404).json({ message: "Invalid redirect code" });
  return res.redirect(click.targetUrl);
});

export default router;
