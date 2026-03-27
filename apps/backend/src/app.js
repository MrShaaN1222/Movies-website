import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import movieRoutes from "./routes/movies.routes.js";
import providerRoutes from "./routes/providers.routes.js";
import freeRoutes from "./routes/free.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import ottRoutes from "./routes/ott.routes.js";
import recommendationRoutes from "./routes/recommendations.routes.js";
import monetizationRoutes from "./routes/monetization.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";
import { env } from "./config/env.js";

function getAllowedOrigins() {
  const configured = (env.FRONTEND_URLS || env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (env.NODE_ENV !== "production") {
    configured.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  return new Set(configured);
}

function isPrivateNetworkDevOrigin(origin) {
  return /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):3000$/.test(
    origin
  );
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        if (env.NODE_ENV !== "production" && isPrivateNetworkDevOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Origin not allowed by CORS"));
      },
    })
  );
  app.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/movies", movieRoutes);
  app.use("/api/v1/movies", reviewRoutes);
  app.use("/api/v1/movies", providerRoutes);
  app.use("/api/v1/free-movies", freeRoutes);
  app.use("/api/v1/blog", blogRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/ott", ottRoutes);
  app.use("/api/v1/recommendations", recommendationRoutes);
  app.use("/api/v1/monetization", monetizationRoutes);
  app.use("/api/v1/newsletter", newsletterRoutes);
  app.use("/", providerRoutes);

  return app;
}
