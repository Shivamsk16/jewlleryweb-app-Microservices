import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import routes from "./routes";
import { errorHandler, notFound } from "./middleware/errorHandler";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      // Reflect the configured frontend origin and allow cookies.
      // For multiple frontends, replace with a function that checks an allow-list.
      origin: FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // All API routes are mounted under /api so the frontend's
  // NEXT_PUBLIC_API_URL + "/api/..." paths line up 1:1 with the old monolith.
  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
