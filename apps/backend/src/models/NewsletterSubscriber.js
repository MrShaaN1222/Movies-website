import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed" },
    source: { type: String, default: "footer-form" },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
