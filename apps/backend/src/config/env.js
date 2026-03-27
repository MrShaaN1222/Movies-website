import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  TMDB_API_KEY: process.env.TMDB_API_KEY || "",
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  FRONTEND_URLS: process.env.FRONTEND_URLS || "",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  PLAYBACK_SIGNING_SECRET: process.env.PLAYBACK_SIGNING_SECRET || "",
};
