import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, index: true, sparse: true },
    slug: { type: String, unique: true, index: true },
    title: { type: String, required: true, index: true },
    overview: String,
    releaseDate: String,
    posterUrl: String,
    backdropUrl: String,
    genres: [{ type: String, index: true }],
    cast: [{ name: String, character: String }],
    crew: [{ name: String, role: String }],
    ratings: {
      tmdb: Number,
      userAverage: Number,
      totalReviews: { type: Number, default: 0 },
    },
    trailers: [{ name: String, youtubeId: String }],
    providers: [
      {
        name: String,
        url: String,
        affiliateUrl: String,
      },
    ],
  },
  { timestamps: true }
);

movieSchema.index({ title: "text", overview: "text", genres: "text" });

export const Movie = mongoose.model("Movie", movieSchema);
