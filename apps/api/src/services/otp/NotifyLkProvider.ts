import axios from "axios";
import { OtpProvider } from "./OtpProvider";
import { env } from "@/config/env";

// Notify.lk SMS API (Sri Lanka): https://app.notify.lk/api/v1/send
export class NotifyLkProvider implements OtpProvider {
  async send(phone: string, code: string): Promise<void> {
    const { userId, apiKey, senderId } = env.notifyLk;
    if (!userId || !apiKey) {
      throw new Error("NOTIFYLK_USER_ID / NOTIFYLK_API_KEY not configured");
    }

    const formattedPhone = phone.startsWith("0") ? `94${phone.slice(1)}` : phone;

    await axios.get("https://app.notify.lk/api/v1/send", {
      params: {
        user_id: userId,
        api_key: apiKey,
        sender_id: senderId || undefined,
        to: formattedPhone,
        message: `Your GlamEdge verification code is ${code}. Valid for 5 minutes.`,
      },
    });
  }
}
