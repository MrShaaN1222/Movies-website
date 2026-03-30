import mongoose from "mongoose";
import { env } from "./env.js";

/** Fail fast instead of hanging ~10s when the DB is unreachable. */
mongoose.set("bufferCommands", false);

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  maxPoolSize: 10,
};

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Set it in your .env file.");
  }
  await mongoose.connect(env.MONGODB_URI, CONNECT_OPTIONS);
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
