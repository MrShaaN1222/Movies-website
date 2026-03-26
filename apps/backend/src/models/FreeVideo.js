import mongoose from "mongoose";

const freeVideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    youtubeId: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ["Free Bollywood", "Free Hollywood", "Documentaries"],
      required: true,
      index: true,
    },
    sourceType: { type: String, enum: ["youtube", "public-domain"], default: "youtube" },
    sourceUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const FreeVideo = mongoose.model("FreeVideo", freeVideoSchema);
