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

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL }));
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
