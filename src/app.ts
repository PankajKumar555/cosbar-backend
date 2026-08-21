import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import productRoutes from "./routes/product.routes";
import categoriesRoutes from "./routes/category.routes";
import userRoutes from "./routes/user.routes";
import bannersRoutes from "./routes/baneer.routes";
import videoRoutes from "./routes/video.routes";
import reviewRoutes from "./routes/review.routes";
import gifRoutes from "./routes/gif.routes";
import searchProducts from "./routes/search.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import path from "path";
import mime from "mime";
import { config } from "./config/env";

const app = express();

// Hosting platforms (Render, Railway, nginx, ELB) terminate TLS and forward the
// real client IP in X-Forwarded-For. Without this, req.ip is the proxy's address
// and every visitor shares one rate-limit bucket.
app.set("trust proxy", 1);

// Security headers. crossOriginResourcePolicy is relaxed because /uploads serves
// product images to a frontend on a different origin.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS — restrict to allowed origins
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  }),
);

// Cap the JSON body size; the default 100kb is fine for carts but the explicit
// limit keeps a malformed client from being treated as a server fault.
app.use(express.json({ limit: "1mb" }));

// Generous global cap — high enough that normal browsing never hits it, low
// enough to blunt scraping and brute force.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  }),
);

// Credential endpoints get a much tighter cap than the rest of the API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: "Too many authentication attempts, please try again later.",
  },
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/user", authLimiter, userRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoriesRoutes);
app.use("/banners", bannersRoutes);
app.use("/videos", videoRoutes);
app.use("/reviews", reviewRoutes);
app.use("/gifs", gifRoutes);
app.use("/search", searchProducts);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

// Static file serving for uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
      const contentType = mime.getType(filePath);
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
    },
  }),
);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler.
// `err` is whatever was thrown, so it is not guaranteed to be an Error — reading
// .stack off a thrown string/undefined would throw again inside the handler and
// take the process down with an unreadable router-only stack.
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(
    `Unhandled error on ${req.method} ${req.originalUrl}:`,
    err instanceof Error ? (err.stack ?? err.message) : err,
  );

  // Headers already flushed means the response is half-written; the only correct
  // move is to hand it back to Express to destroy the socket.
  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({ message: "Internal server error" });
});

export default app;
