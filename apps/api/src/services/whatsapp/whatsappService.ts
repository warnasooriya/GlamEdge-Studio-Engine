import axios from "axios";
import { env, isWhatsAppConfigured } from "@/config/env";

interface WhatsAppInvoicePayload {
  clientPhone: string;
  clientName: string;
  salonName: string;
  totalAmount: string;
  pdfInvoiceUrl: string;
}

export const sendWhatsAppInvoice = async (payload: WhatsAppInvoicePayload) => {
  const { clientPhone, clientName, salonName, totalAmount, pdfInvoiceUrl } = payload;

  const formattedPhone = clientPhone.startsWith("0") ? `94${clientPhone.slice(1)}` : clientPhone;

  if (!isWhatsAppConfigured) {
    console.log(
      `[whatsapp:dev-stub] Would send invoice to ${formattedPhone}: ${salonName} — LKR ${totalAmount} — ${pdfInvoiceUrl} (set WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID to send for real)`
    );
    return { stubbed: true };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.whatsapp.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "salon_invoice_receipt",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: clientName },
                { type: "text", text: salonName },
                { type: "text", text: totalAmount },
                { type: "text", text: pdfInvoiceUrl },
              ],
            },
          ],
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
