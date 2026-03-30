/**
 * Upserts rich demo OTT show (Season 1 + 7 episodes) for slug mirai-original-the-last-signal.
 * Run from repo root: npm run seed:ott-demo -w @mirai/backend
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

const { OTT_DEMO_LAST_SIGNAL } = await import("../src/data/ottDemoLastSignal.js");
const { OttContent } = await import("../src/models/OttContent.js");

const { _id: _legacyId, ...payload } = OTT_DEMO_LAST_SIGNAL;

await mongoose.connect(MONGODB_URI);
const doc = await OttContent.findOneAndUpdate(
  { slug: payload.slug },
  { $set: payload },
  { upsert: true, returnDocument: "after", runValidators: true }
);
console.log("Upserted OTT demo show:", doc.slug, "— seasons:", doc.seasons?.length ?? 0);
await mongoose.disconnect();
