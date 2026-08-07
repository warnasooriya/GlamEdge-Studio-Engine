import axios from "axios";
import { env, isWhatsAppConfigured, isWhatsAppWebConfigured } from "@/config/env";
import { sendImageViaWhatsAppWeb, sendTextViaWhatsAppWeb } from "@/services/whatsapp/whatsappWebClient";

function formatPhone(clientPhone: string): string {
  return clientPhone.startsWith("0") ? `94${clientPhone.slice(1)}` : clientPhone;
}

// Freeform (non-template) WhatsApp messages only deliver within WhatsApp's 24-hour
// customer-service window; outside that window Meta requires a pre-approved template.
// whatsapp-web.js has no such restriction, so it's tried first when configured — the
// Cloud API here only exists as a fallback for when that session is logged out,
// crash-looping, or not yet scanned in. See apps/whatsapp-web/README.md.
export async function sendWhatsAppText(clientPhone: string, message: string) {
  const formattedPhone = formatPhone(clientPhone);

  if (isWhatsAppWebConfigured) {
    try {
      await sendTextViaWhatsAppWeb(clientPhone, message);
      return { via: "whatsapp-web" };
    } catch (error) {
      console.error("whatsapp-web text send failed, falling back to Cloud API:", error);
    }
  }

  if (!isWhatsAppConfigured) {
    console.log(
      `[whatsapp:dev-stub] Would send text to ${formattedPhone}: ${message} (set WHATSAPP_WEB_INTERNAL_SECRET or WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID to send for real)`
    );
    return { stubbed: true };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.whatsapp.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: message },
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
    console.error("Failed to send WhatsApp text message:", error);
    throw new Error("WhatsApp dispatch failed");
  }
}

export async function sendWhatsAppImage(clientPhone: string, imageUrl: string, caption: string) {
  const formattedPhone = formatPhone(clientPhone);

  if (isWhatsAppWebConfigured) {
    try {
      await sendImageViaWhatsAppWeb(clientPhone, imageUrl, caption);
      return { via: "whatsapp-web" };
    } catch (error) {
      console.error("whatsapp-web image send failed, falling back to Cloud API:", error);
    }
  }

  if (!isWhatsAppConfigured) {
    console.log(
      `[whatsapp:dev-stub] Would send image to ${formattedPhone}: ${caption} — ${imageUrl} (set WHATSAPP_WEB_INTERNAL_SECRET or WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID to send for real)`
    );
    return { stubbed: true };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.whatsapp.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "image",
        image: { link: imageUrl, caption },
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
    console.error("Failed to send WhatsApp image message:", error);
    throw new Error("WhatsApp dispatch failed");
  }
}

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
  const caption = `${salonName} — Total LKR ${totalAmount}. Thank you for visiting!`;
  return sendWhatsAppImage(clientPhone, receiptImageUrl, caption);
};
