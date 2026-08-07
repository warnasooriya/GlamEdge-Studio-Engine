import axios from "axios";
import { env, isWhatsAppWebConfigured } from "@/config/env";

const client = axios.create({
  baseURL: env.whatsappWeb.serviceUrl,
  timeout: 15_000,
  headers: { "x-internal-secret": env.whatsappWeb.internalSecret },
});

export async function sendTextViaWhatsAppWeb(phone: string, message: string): Promise<boolean> {
  if (!isWhatsAppWebConfigured) return false;
  await client.post("/send/text", { phone, message });
  return true;
}

export async function sendImageViaWhatsAppWeb(phone: string, imageUrl: string, caption: string): Promise<boolean> {
  if (!isWhatsAppWebConfigured) return false;
  await client.post("/send/image", { phone, imageUrl, caption });
  return true;
}
