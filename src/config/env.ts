import dotenv from "dotenv";
dotenv.config();

// Centralized config — single source of truth for all env variables
export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  adminEmail: process.env.ADMIN_EMAIL || "pankajsing555@gmail.com",
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
      ],
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  emailFrom: process.env.EMAIL_FROM || "pankajsing555@gmail.com",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

// Validate required env vars at startup
const requiredVars = ["MONGO_URI", "JWT_SECRET"] as const;
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

if (config.isProduction) {
  // The localhost fallback below would reject every request from a deployed
  // frontend, and CORS failures surface in the browser rather than the server
  // log — so fail at boot instead of at first request.
  if (!process.env.ALLOWED_ORIGINS) {
    console.error(
      "❌ ALLOWED_ORIGINS must be set in production (comma-separated origins).",
    );
    process.exit(1);
  }

  // "mongodb+srv://host/?opts" with no path segment resolves to the "test"
  // database, which is almost never what a production deploy intends.
  if (/mongodb(\+srv)?:\/\/[^/]+\/?(\?|$)/.test(config.mongoUri)) {
    console.error(
      "❌ MONGO_URI has no database name. Add one before the '?' (e.g. .../cosbar?retryWrites=true).",
    );
    process.exit(1);
  }

  if (config.jwtSecret.length < 32) {
    console.error("❌ JWT_SECRET must be at least 32 characters in production.");
    process.exit(1);
  }
}
