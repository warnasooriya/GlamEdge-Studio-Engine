import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? "5000"),
  internalSecret: required("WHATSAPP_WEB_INTERNAL_SECRET"),
  // docker-compose.yml sets this explicitly to an absolute path under a named
  // volume, so LocalAuth's session survives a container restart/redeploy —
  // losing it means rescanning the QR code. The relative default here is for
  // local dev only, run straight from apps/whatsapp-web with plain `pnpm dev`.
  sessionDataPath: process.env.SESSION_DATA_PATH ?? ".wwebjs_auth",
  // Set by the Dockerfile to the apt-installed Chromium binary. Left unset in
  // local dev, where puppeteer's own downloaded Chromium is used instead.
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
};
