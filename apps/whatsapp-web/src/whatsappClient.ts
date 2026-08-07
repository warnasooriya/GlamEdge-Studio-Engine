import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import QRCode from "qrcode";
import { config } from "@/config";

type State = "starting" | "qr" | "authenticated" | "ready" | "disconnected";

let state: State = "starting";
let lastQrDataUrl: string | null = null;
let client: Client;

function formatChatId(phone: string): string {
  // Mirrors apps/api's formatPhone: local "0"-prefixed numbers are Sri Lankan
  // and become "94..."; anything else is assumed already-international.
  const digits = phone.startsWith("0") ? `94${phone.slice(1)}` : phone;
  return `${digits}@c.us`;
}

function buildClient(): Client {
  return new Client({
    authStrategy: new LocalAuth({ dataPath: config.sessionDataPath }),
    puppeteer: {
      executablePath: config.puppeteerExecutablePath,
      // This box runs on a memory-constrained instance, so these trade some
      // rendering robustness for a materially smaller Chromium footprint —
      // see apps/whatsapp-web/README.md for the memory budget this assumes.
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    },
  });
}

export function initWhatsAppClient() {
  client = buildClient();

  client.on("qr", async (qr) => {
    state = "qr";
    lastQrDataUrl = await QRCode.toDataURL(qr);
    console.log("[whatsapp-web] New QR code — fetch GET /qr and scan it with the salon's WhatsApp within ~20s.");
  });

  client.on("authenticated", () => {
    state = "authenticated";
    lastQrDataUrl = null;
    console.log("[whatsapp-web] Authenticated — waiting for session to become ready.");
  });

  client.on("ready", () => {
    state = "ready";
    console.log("[whatsapp-web] Ready — WhatsApp Web session is live.");
  });

  client.on("auth_failure", (msg) => {
    console.error("[whatsapp-web] Auth failure:", msg);
  });

  // whatsapp-web.js's own instance is left unusable after a disconnect — the
  // documented recovery is to build and initialize a fresh Client rather than
  // reuse this one, so a lost connection doesn't leave the service stuck
  // reporting "ready" forever with no way to actually send.
  client.on("disconnected", (reason) => {
    state = "disconnected";
    console.error("[whatsapp-web] Disconnected:", reason, "— reinitializing in 5s.");
    setTimeout(() => {
      client = buildClient();
      wireAndInit();
    }, 5000);
  });

  client.initialize().catch((err) => {
    console.error("[whatsapp-web] Failed to initialize:", err);
  });
}

function wireAndInit() {
  initWhatsAppClient();
}

export function getStatus() {
  return { state, hasQr: lastQrDataUrl !== null };
}

export function getQrDataUrl(): string | null {
  return lastQrDataUrl;
}

export async function sendText(phone: string, message: string) {
  if (state !== "ready") {
    throw new Error(`WhatsApp Web session not ready (state: ${state})`);
  }
  await client.sendMessage(formatChatId(phone), message);
}

export async function sendImage(phone: string, imageUrl: string, caption: string) {
  if (state !== "ready") {
    throw new Error(`WhatsApp Web session not ready (state: ${state})`);
  }
  const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
  await client.sendMessage(formatChatId(phone), media, { caption });
}
