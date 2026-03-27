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
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPremium: { type: Boolean, default: true },
    isAdult: { type: Boolean, default: false },
    contentRating: { type: String, default: "" },
  },
  { timestamps: true }
);

export const OttContent = mongoose.model("OttContent", ottContentSchema);
