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

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: FRONTEND_URL,
      credentials: true,
    }),
  );

  // Body parser
  app.use(express.json({ limit: "2mb" }));

  // Cookie parser
  app.use(cookieParser());

  // Logger
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // ✅ Root / Health Check Route
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "JewelFlow API running 🚀",
    });
  });

  // API Routes
  app.use("/api", routes);

  // 404 Handler
  app.use(notFound);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}