import axios from "axios";
import { env, isPayPalConfigured, paypalApiBase } from "@/config/env";
import { HttpError } from "@/middlewares/errorHandler";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const res = await axios.post<{ access_token: string; expires_in: number }>(
    `${paypalApiBase}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: { username: env.paypal.clientId, password: env.paypal.clientSecret },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  // Refresh a little early so a request never races an about-to-expire token.
  cachedToken = {
    accessToken: res.data.access_token,
    expiresAt: Date.now() + (res.data.expires_in - 60) * 1000,
  };
  return cachedToken.accessToken;
}

function assertConfigured() {
  if (!isPayPalConfigured) {
    throw new HttpError(503, "PayPal is not configured");
  }
}

export interface CreateOrderParams {
  amountUsd: number;
  payeeEmail: string;
  customId: string;
  description: string;
}

export async function createOrder(params: CreateOrderParams): Promise<{ orderId: string }> {
  assertConfigured();
  const token = await getAccessToken();

  const res = await axios.post<{ id: string }>(
    `${paypalApiBase}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: params.amountUsd.toFixed(2) },
          payee: { email_address: params.payeeEmail },
          custom_id: params.customId,
          invoice_id: params.customId,
          description: params.description.slice(0, 127),
        },
      ],
    },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );

  return { orderId: res.data.id };
}

export interface CaptureResult {
  captureId: string;
  status: string;
  payerEmail: string | null;
}

export async function captureOrder(orderId: string): Promise<CaptureResult> {
  assertConfigured();
  const token = await getAccessToken();

  const res = await axios.post(
    `${paypalApiBase}/v2/checkout/orders/${orderId}/capture`,
    {},
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );

  const capture = res.data?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) {
    throw new HttpError(502, "PayPal capture response was missing a capture record");
  }

  return {
    captureId: capture.id,
    status: capture.status,
    payerEmail: res.data?.payer?.email_address ?? null,
  };
}
