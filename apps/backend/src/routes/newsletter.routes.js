import express from "express";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber.js";

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/subscribe", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Please provide a valid email address." });
  }

  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing) {
    if (existing.status !== "subscribed") {
      existing.status = "subscribed";
      await existing.save();
    }
    return res.json({ message: "This email is already subscribed." });
  }

  await NewsletterSubscriber.create({ email, source: "footer-form" });
  return res.status(201).json({ message: "Subscribed successfully for latest updates." });
});

router.post("/notify-new-movie", async (req, res) => {
  const movieTitle = String(req.body?.movieTitle || "").trim();
  const movieLink = String(req.body?.movieLink || "").trim();

  if (!movieTitle) {
    return res.status(400).json({ message: "movieTitle is required." });
  }

  const subscribers = await NewsletterSubscriber.find({ status: "subscribed" }).select("email");

  // Placeholder for real email provider integration.
  // Here we simulate the notification dispatch.
  const notifications = subscribers.map((sub) => ({
    to: sub.email,
    subject: `New movie added: ${movieTitle}`,
    body: `A new title is now available: ${movieTitle}${movieLink ? `\nWatch: ${movieLink}` : ""}`,
  }));

  await NewsletterSubscriber.updateMany(
    { status: "subscribed" },
    { $set: { lastNotifiedAt: new Date() } }
  );

  return res.json({
    message: "Notification dispatch completed.",
    totalSubscribers: subscribers.length,
    notificationsPreview: notifications.slice(0, 5),
  });
});

export default router;
