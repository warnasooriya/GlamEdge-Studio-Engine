import axios from "axios";
import { OtpProvider } from "./OtpProvider";
import { env } from "@/config/env";

// Text.lk SMS API (Sri Lanka): https://app.text.lk/developers/http-docs
export class TextLkProvider implements OtpProvider {
  async send(phone: string, code: string): Promise<void> {
    const { apiToken, senderId } = env.textLk;
    if (!apiToken) {
      throw new Error("TEXTLK_API_TOKEN not configured");
    }
    if (!senderId) {
      // Unlike Notify.lk, Text.lk rejects a send with no sender_id — there's no
      // platform default to silently fall back to.
      throw new Error("TEXTLK_SENDER_ID not configured");
    }

    const formattedPhone = phone.startsWith("0") ? `94${phone.slice(1)}` : phone;

    await axios.post(
      "https://app.text.lk/api/http/sms/send",
      {
        api_token: apiToken,
        recipient: formattedPhone,
        sender_id: senderId,
        type: "otp",
        message: `Your GlamEdge verification code is ${code}. Valid for 5 minutes.`,
      },
      { headers: { "Content-Type": "application/json", Accept: "application/json" } }
    );
  }
}
