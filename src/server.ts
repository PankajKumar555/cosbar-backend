import app from "./app";
import { connectDB } from "./config/db";
import { config } from "./config/env";

const PORT = config.port;

// Without these, a rejection thrown outside a request's promise chain kills the
// process printing only the router frames, with no message and no top frames.
process.on("unhandledRejection", (reason) => {
  console.error(
    "🔥 Unhandled promise rejection:",
    reason instanceof Error ? (reason.stack ?? reason.message) : reason,
  );
});

process.on("uncaughtException", (error) => {
  console.error("🔥 Uncaught exception:", error?.stack ?? error);
  process.exit(1);
});

connectDB().then(() => {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n🛑 Shutting down gracefully...");
    server.close(() => {
      console.log("🔌 Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
