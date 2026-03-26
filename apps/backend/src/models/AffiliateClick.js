import mongoose from "mongoose";

const affiliateClickSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    movieSlug: { type: String, required: true, index: true },
    provider: { type: String, required: true, index: true },
    targetUrl: { type: String, required: true },
    sourcePage: { type: String, default: "movie-details" },
    clickedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AffiliateClick = mongoose.model("AffiliateClick", affiliateClickSchema);
