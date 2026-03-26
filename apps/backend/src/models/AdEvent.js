import mongoose from "mongoose";

const adEventSchema = new mongoose.Schema(
  {
    placement: { type: String, required: true, index: true },
    type: { type: String, enum: ["impression", "click", "video_start"], required: true },
    page: { type: String, required: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const AdEvent = mongoose.model("AdEvent", adEventSchema);
