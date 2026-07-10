const dotenv = require("dotenv");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const fallbackJwtSecret = "dev-only-change-this-secret";

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required when NODE_ENV=production.");
}

function normalizeOrigin(value) {
  return value ? value.trim().replace(/\/$/, "") : "";
}

function parseFrontendOrigins() {
  const fallbackFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const configuredOrigins = process.env.FRONTEND_URLS || fallbackFrontendUrl;

  return configuredOrigins
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  frontendUrls: parseFrontendOrigins(),
  jwtSecret: process.env.JWT_SECRET || fallbackJwtSecret,
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || "borrowa/listings"
  }
};

module.exports = env;
