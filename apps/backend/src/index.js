import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const app = createApp();
let dbConnected = false;

async function connectWithRetry() {
  try {
    await connectDatabase();
    dbConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    dbConnected = false;
    console.error("MongoDB connection failed. Retrying in 10s...");
    console.error(error?.message || error);
    setTimeout(connectWithRetry, 10000);
  }
}

async function start() {
  await connectWithRetry();
  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
