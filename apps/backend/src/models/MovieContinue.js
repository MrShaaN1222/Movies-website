import mongoose from "mongoose";

const movieContinueSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    movieSlug: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

movieContinueSchema.index({ userId: 1, movieSlug: 1 }, { unique: true });

export const MovieContinue = mongoose.model("MovieContinue", movieContinueSchema);
