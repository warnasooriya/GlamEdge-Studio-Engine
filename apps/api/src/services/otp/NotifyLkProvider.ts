import axios from "axios";
import { OtpProvider } from "./OtpProvider";
import { env } from "@/config/env";

// Notify.lk SMS API (Sri Lanka): https://app.notify.lk/api/v1/send
// export class NotifyLkProvider implements OtpProvider {
//   async send(phone: string, code: string): Promise<void> {
//     const { userId, apiKey, senderId } = env.notifyLk;
//     if (!userId || !apiKey) {
//       throw new Error("NOTIFYLK_USER_ID / NOTIFYLK_API_KEY not configured");
//     }

//     const formattedPhone = phone.startsWith("0") ? `94${phone.slice(1)}` : phone;

//     await axios.get("https://app.notify.lk/api/v1/send", {
//       params: {
//         user_id: userId,
//         api_key: apiKey,
//         sender_id: senderId || undefined,
//         to: formattedPhone,
//         message: `Your GlamEdge verification code is ${code}. Valid for 5 minutes.`,
//       },
//     });
//   }
// }

export class NotifyLkProvider implements OtpProvider {
  async send(phone: string, code: string): Promise<void> {
    const { userId, apiKey, senderId } = env.notifyLk;

    if (!userId || !apiKey) {
      const configError = "[NotifyLkProvider] Missing configuration: NOTIFYLK_USER_ID or NOTIFYLK_API_KEY is not defined.";
      console.error(configError);
      throw new Error("NOTIFYLK_USER_ID / NOTIFYLK_API_KEY not configured");
    }

    const formattedPhone = phone.startsWith("0") ? `94${phone.slice(1)}` : phone;

    console.log(`[NotifyLkProvider] Attempting to send OTP to ${formattedPhone}...`);

    try {
      const response = await axios.get("https://app.notify.lk/api/v1/send", {
        params: {
          user_id: userId,
          api_key: apiKey,
          sender_id: senderId || undefined,
          to: formattedPhone,
          message: `Your GlamEdge verification code is ${code}. Valid for 5 minutes.`,
        },
      });

      console.log("[NotifyLkProvider] OTP sent successfully.", {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("[NotifyLkProvider] API Request Failed:", {
          message: error.message,
          status: error.response?.status,
          responseData: error.response?.data,
        });
      } else {
        console.error("[NotifyLkProvider] Unexpected Error:", error);
      }

      throw error;
    }
  }
}