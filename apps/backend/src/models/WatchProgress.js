import mongoose from "mongoose";

const watchProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ottContentId: { type: mongoose.Schema.Types.ObjectId, ref: "OttContent", index: true },
    seconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    deviceId: { type: String, default: "web" },
  },
  { timestamps: true }
);

watchProgressSchema.index({ userId: 1, ottContentId: 1 }, { unique: true });

export const WatchProgress = mongoose.model("WatchProgress", watchProgressSchema);
