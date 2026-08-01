import axios from "axios";
import { env, isWhatsAppConfigured } from "@/config/env";

interface WhatsAppInvoicePayload {
  clientPhone: string;
  clientName: string;
  salonName: string;
  totalAmount: string;
  pdfInvoiceUrl: string;
  receiptImageUrl: string;
}

export const sendWhatsAppInvoice = async (payload: WhatsAppInvoicePayload) => {
  const { clientPhone, salonName, totalAmount, receiptImageUrl } = payload;

  const formattedPhone = clientPhone.startsWith("0") ? `94${clientPhone.slice(1)}` : clientPhone;
  const caption = `${salonName} — Total LKR ${totalAmount}. Thank you for visiting!`;

  if (!isWhatsAppConfigured) {
    console.log(
      `[whatsapp:dev-stub] Would send receipt image to ${formattedPhone}: ${caption} — ${receiptImageUrl} (set WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID to send for real)`
    );
    return { stubbed: true };
  }

  // Freeform image messages only deliver within WhatsApp's 24-hour customer-service
  // window; outside that window Meta requires a pre-approved template instead.
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.whatsapp.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "image",
        image: {
          link: receiptImageUrl,
          caption,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${env.whatsapp.token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    throw new Error("WhatsApp dispatch failed");
  }
};
