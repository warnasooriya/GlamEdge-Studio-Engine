import dotenv from "dotenv";

dotenv.config();

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(optional("PORT", "4000")),
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:5173"),

  // Base URL that locally-stored uploads are served from. Behind a reverse proxy
  // set this to the public origin (https://your-domain), or to an empty string to
  // emit same-origin relative URLs. Defaults to the dev API origin.
  publicUrl: optional("PUBLIC_URL", `http://localhost:${optional("PORT", "4000")}`).replace(/\/+$/, ""),

  databaseUrl: optional("DATABASE_URL"),
  mongodbUri: optional("MONGODB_URI", "mongodb://localhost:27017/glamedge_feed"),
  redisUrl: optional("REDIS_URL", "redis://localhost:6379"),

  jwtSecret: optional("JWT_SECRET", "dev-only-insecure-secret"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),

  otpProvider: optional("OTP_PROVIDER", "console"),
  notifyLk: {
    userId: optional("NOTIFYLK_USER_ID"),
    apiKey: optional("NOTIFYLK_API_KEY"),
    senderId: optional("NOTIFYLK_SENDER_ID"),
  },
  textLk: {
    apiToken: optional("TEXTLK_API_TOKEN"),
    senderId: optional("TEXTLK_SENDER_ID"),
  },

  aws: {
    accessKeyId: optional("AWS_ACCESS_KEY_ID"),
    secretAccessKey: optional("AWS_SECRET_ACCESS_KEY"),
    region: optional("AWS_REGION"),
    bucket: optional("AWS_S3_BUCKET"),
    cloudfrontUrl: optional("AWS_CLOUDFRONT_URL"),
  },

  whatsapp: {
    token: optional("WHATSAPP_CLOUD_API_TOKEN"),
    phoneNumberId: optional("WHATSAPP_PHONE_NUMBER_ID"),
  },

  adminBootstrap: {
    email: optional("ADMIN_EMAIL", "admin@glamedge.dev"),
    password: optional("ADMIN_PASSWORD", ""),
  },
};

export const isS3Configured = Boolean(
  env.aws.accessKeyId && env.aws.secretAccessKey && env.aws.bucket && env.aws.region
);

export const isWhatsAppConfigured = Boolean(env.whatsapp.token && env.whatsapp.phoneNumberId);

export { required };
