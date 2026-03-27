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

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getAllowedOrigins() {
  const configured = (env.FRONTEND_URLS || env.FRONTEND_URL || "")
    .split(",")
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);

  // Production defaults for known frontend deployments if env vars are incomplete.
  configured.push("https://miraimoviesai.vercel.app", "https://mirai-movies-ai.netlify.app");

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
  const corsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.has(normalizedOrigin)) return callback(null, true);
      if (env.NODE_ENV !== "production" && isPrivateNetworkDevOrigin(normalizedOrigin)) {
        return callback(null, true);
      }
      // Avoid 500 on preflight for disallowed origins.
      return callback(null, false);
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
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
