import { redis } from "@/config/redis";
import { env } from "@/config/env";
import { HttpError } from "@/middlewares/errorHandler";

const OTP_TTL_SECONDS = 5 * 60;
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX_REQUESTS = 5;

function otpKey(phone: string) {
  return `otp:code:${phone}`;
}

function rateLimitKey(phone: string) {
  return `otp:rate:${phone}`;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// The single phone number reserved for App Store / Play Store review. Reviewers
// are outside our SMS provider's reach, so this number verifies against a fixed
// code rather than a texted one. Requires BOTH env vars, so the bypass simply
// doesn't exist in any environment that hasn't deliberately opted in.
export function isDemoPhone(phone: string): boolean {
  const { phone: demoPhone, code: demoCode } = env.demoAccount;
  return Boolean(demoPhone && demoCode && phone === demoPhone);
}

export async function issueOtp(phone: string): Promise<string> {
  const attempts = await redis.incr(rateLimitKey(phone));
  if (attempts === 1) {
    await redis.expire(rateLimitKey(phone), RATE_LIMIT_WINDOW_SECONDS);
  }
  if (attempts > RATE_LIMIT_MAX_REQUESTS) {
    throw new HttpError(429, "Too many OTP requests. Please try again later.");
  }

  const code = generateCode();
  await redis.set(otpKey(phone), code, "EX", OTP_TTL_SECONDS);
  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  if (isDemoPhone(phone)) {
    return code === env.demoAccount.code;
  }
  const stored = await redis.get(otpKey(phone));
  return Boolean(stored && stored === code);
}

// Call only once the caller is certain the OTP-verified flow will complete
// (e.g. after any "extra fields required for first-time registration" checks
// have passed) — deleting eagerly inside verifyOtp() would burn the code on
// a check that then fails validation, breaking the user's very next retry.
export async function consumeOtp(phone: string): Promise<void> {
  // The demo code is a fixed constant rather than a one-shot value — there is no
  // Redis entry to clear, and it has to keep working for every future review.
  if (isDemoPhone(phone)) return;
  await redis.del(otpKey(phone));
}
