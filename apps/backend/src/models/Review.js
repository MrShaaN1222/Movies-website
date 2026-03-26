import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    rating: { type: Number, min: 1, max: 10, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
