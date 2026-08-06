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

    // "plain", not "otp" — Text.lk's "otp" type expects a placeholder in the
    // message that THEIR gateway fills in with a code it generates itself
    // ("No OTP placeholder found in the message" if you send fully-composed
    // text). We already generate and validate our own code via otpStore, so
    // "plain" — which accepts arbitrary text as-is — is the correct type here.
    const res = await axios.post(
      "https://app.text.lk/api/http/sms/send",
      {
        api_token: apiToken,
        recipient: formattedPhone,
        sender_id: senderId,
        type: "plain",
        message: `Your GlamEdge verification code is ${code}. Valid for 5 minutes.`,
      },
      { headers: { "Content-Type": "application/json", Accept: "application/json" } }
    );

    // Text.lk returns HTTP 200 even for logical failures (e.g. bad sender_id,
    // insufficient balance) — the failure only shows up in the response body.
    // Without this check, every send "succeeds" from our side regardless of
    // whether the SMS actually went out.
    if (res.data?.status !== "success") {
      throw new Error(`Text.lk send failed: ${res.data?.message || "unknown error"}`);
    }
  }
}
