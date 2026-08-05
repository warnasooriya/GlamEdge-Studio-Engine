import axios from "axios";
import { env, isWhatsAppConfigured } from "@/config/env";

async function main() {
  console.log("isWhatsAppConfigured:", isWhatsAppConfigured);
  const phone = "94700100379"; // synthetic test number, safe
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.whatsapp.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: "Diagnostic test message" },
      },
      {
        headers: {
          Authorization: `Bearer ${env.whatsapp.token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("SUCCESS:", JSON.stringify(response.data));
  } catch (error: any) {
    console.log("STATUS:", error.response?.status);
    console.log("ERROR BODY:", JSON.stringify(error.response?.data, null, 2));
  }
}

main();
