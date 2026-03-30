import mongoose from "mongoose";

const ottContentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    slug: { type: String, unique: true, index: true },
    type: {
      type: String,
      enum: ["short-film", "course", "exclusive"],
      required: true,
    },
    description: String,
    posterUrl: String,
    hlsUrl: String,
    trailerHlsUrl: String,
    previewHlsUrl: String,
    hlsPreviewUrl: String,
    year: Number,
    durationMin: Number,
    languages: [String],
    genres: [String],
    director: String,
    cast: [String],
    publisher: String,
    seasons: [
      {
        seasonNumber: Number,
        title: String,
        episodes: [
          {
            episodeNumber: Number,
            title: String,
            description: String,
            posterUrl: String,
            durationMin: Number,
            releasedAt: Date,
          },
        ],
      },
    ],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPremium: { type: Boolean, default: true },
    isAdult: { type: Boolean, default: false },
    contentRating: { type: String, default: "" },
  },
  { timestamps: true }
);

export const OttContent = mongoose.model("OttContent", ottContentSchema);
