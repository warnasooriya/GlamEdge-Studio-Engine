import { redis } from "@/config/redis";
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
  const stored = await redis.get(otpKey(phone));
  return Boolean(stored && stored === code);
}

// Call only once the caller is certain the OTP-verified flow will complete
// (e.g. after any "extra fields required for first-time registration" checks
// have passed) — deleting eagerly inside verifyOtp() would burn the code on
// a check that then fails validation, breaking the user's very next retry.
export async function consumeOtp(phone: string): Promise<void> {
  await redis.del(otpKey(phone));
}
