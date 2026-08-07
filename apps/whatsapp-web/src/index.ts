import "express-async-errors";
import express, { NextFunction, Request, Response } from "express";
import { config } from "@/config";
import {
  getQrDataUrl,
  getStatus,
  initWhatsAppClient,
  sendImage,
  sendText,
  shutdownWhatsAppClient,
} from "@/whatsappClient";

const app = express();
app.use(express.json());

// Not exposed publicly — only reachable from the api service over the
// internal Docker network (see docker-compose.yml). Still requires this
// shared secret so a compromised container on the same network, or a
// misconfigured route, can't drive the salon's real WhatsApp session.
function requireInternalSecret(req: Request, res: Response, next: NextFunction) {
  if (req.headers["x-internal-secret"] !== config.internalSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/health", (_req, res) => res.json({ status: "ok", ...getStatus() }));

app.use(requireInternalSecret);

// Rendered as an <img src="data:..."> in the admin UI, or fetched directly —
// either way this is how the salon owner scans in a fresh session after a
// deploy wipes the volume or the previous session gets logged out.
app.get("/qr", (_req, res) => {
  const qr = getQrDataUrl();
  if (!qr) {
    return res.status(404).json({ error: "No QR pending — already authenticated or not yet generated" });
  }
  res.json({ qrDataUrl: qr });
});

app.post("/send/text", async (req, res) => {
  const { phone, message } = req.body as { phone?: string; message?: string };
  if (!phone || !message) {
    return res.status(400).json({ error: "phone and message are required" });
  }
  await sendText(phone, message);
  res.json({ success: true });
});

app.post("/send/image", async (req, res) => {
  const { phone, imageUrl, caption } = req.body as { phone?: string; imageUrl?: string; caption?: string };
  if (!phone || !imageUrl) {
    return res.status(400).json({ error: "phone and imageUrl are required" });
  }
  await sendImage(phone, imageUrl, caption ?? "");
  res.json({ success: true });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[whatsapp-web] Request failed:", err.message);
  res.status(502).json({ error: err.message });
});

app.listen(config.port, () => {
  console.log(`[whatsapp-web] listening on http://localhost:${config.port}`);
});

initWhatsAppClient();

// docker compose stop/restart sends SIGTERM — shutting Chromium down cleanly
// here is what stops a redeploy from leaving stale profile locks behind for
// the next boot to trip over (see cleanStaleChromiumLocks in whatsappClient.ts).
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    console.log(`[whatsapp-web] ${signal} received, shutting down...`);
    await shutdownWhatsAppClient();
    process.exit(0);
  });
}
