import axios from "axios";
import { env } from "@/config/env";

const CACHE_TTL_MS = 60 * 60 * 1000;
const FX_API_URL = "https://open.er-api.com/v6/latest/USD";

let cachedRate: { lkrPerUsd: number; fetchedAt: number } | null = null;

// PayPal doesn't settle in LKR, so every checkout needs a live LKR/USD rate.
// Cached briefly to avoid hitting the third-party API on every request, with a
// configurable fallback (PAYPAL_FALLBACK_LKR_PER_USD) so a flaky FX API can
// never hard-fail checkout — a stale-ish rate is far better than no rate.
export async function getLkrPerUsd(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_TTL_MS) {
    return cachedRate.lkrPerUsd;
  }

  try {
    const res = await axios.get<{ result: string; rates: Record<string, number> }>(FX_API_URL, { timeout: 5000 });
    const rate = res.data?.rates?.LKR;
    if (res.data?.result !== "success" || !rate || rate <= 0) {
      throw new Error("Malformed exchange rate response");
    }
    cachedRate = { lkrPerUsd: rate, fetchedAt: Date.now() };
    return rate;
  } catch (error) {
    console.error("Failed to fetch live LKR/USD rate, using fallback:", error);
    return env.paypal.fallbackLkrPerUsd;
  }
}

export async function convertLkrToUsd(amountLkr: number): Promise<{ amountUsd: number; fxRate: number }> {
  const fxRate = await getLkrPerUsd();
  const amountUsd = Math.round((amountLkr / fxRate) * 100) / 100;
  return { amountUsd, fxRate };
}
