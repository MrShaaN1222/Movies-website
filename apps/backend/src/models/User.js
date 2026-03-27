import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "creator", "user"],
      default: "user",
      index: true,
    },
    watchlist: [{ type: String }],
    favorites: [{ type: String }],
    subscriptionPlan: { type: String, default: "free" },
    phone: { type: String, default: "", trim: true },
    phoneVerified: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
