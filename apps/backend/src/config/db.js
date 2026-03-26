import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Set it in your .env file.");
  }
  await mongoose.connect(env.MONGODB_URI);
}
