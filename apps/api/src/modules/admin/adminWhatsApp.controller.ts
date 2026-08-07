import { Request, Response } from "express";
import axios from "axios";
import { env, isWhatsAppWebConfigured } from "@/config/env";

const client = axios.create({
  baseURL: env.whatsappWeb.serviceUrl,
  timeout: 5_000,
  headers: { "x-internal-secret": env.whatsappWeb.internalSecret },
});

// Thin proxy so the admin UI never talks to the whatsapp-web service (and its
// internal secret) directly — it's only reachable inside the Docker network.
export async function getWhatsAppStatus(_req: Request, res: Response) {
  if (!isWhatsAppWebConfigured) {
    return res.json({ configured: false, state: "unconfigured", hasQr: false });
  }
  try {
    const { data } = await client.get("/health");
    return res.json({ configured: true, ...data });
  } catch {
    return res.json({ configured: true, state: "unreachable", hasQr: false });
  }
}

export async function getWhatsAppQr(_req: Request, res: Response) {
  if (!isWhatsAppWebConfigured) {
    return res.status(404).json({ error: "WhatsApp Web is not configured" });
  }
  try {
    const { data } = await client.get("/qr");
    return res.json(data);
  } catch (err: any) {
    const status = err.response?.status === 404 ? 404 : 502;
    return res.status(status).json({ error: err.response?.data?.error ?? "WhatsApp Web service unreachable" });
  }
}
