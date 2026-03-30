import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const app = createApp();

const RETRY_MS = 10_000;

async function connectWithRetry() {
  for (;;) {
    try {
      await connectDatabase();
      console.log("MongoDB connected");
      return;
    } catch (error) {
      console.error("MongoDB connection failed. Retrying in 10s...");
      console.error(error?.message || error);
      console.error(
        "Tip: For MongoDB Atlas, add your IP under Network Access, or use 0.0.0.0/0 for dev. For local MongoDB, run: docker compose up -d mongo (see repo docker-compose.yml) and set MONGODB_URI=mongodb://127.0.0.1:27017/mirai_movies_ai"
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }
}

async function start() {
  // Listen immediately so the frontend gets HTTP (503 from app middleware) instead of ECONNREFUSED while MongoDB is still connecting.
  void connectWithRetry();
  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
