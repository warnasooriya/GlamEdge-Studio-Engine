import { env } from "@/config/env";
import { OtpProvider } from "./OtpProvider";
import { ConsoleOtpProvider } from "./ConsoleOtpProvider";
import { NotifyLkProvider } from "./NotifyLkProvider";
import { TextLkProvider } from "./TextLkProvider";

function buildOtpProvider(): OtpProvider {
  console.log(`Using OTP provider: ${env.otpProvider}`);
  // Lowercased so OTP_PROVIDER=textLk / TextLK / etc. all resolve the same way —
  // the switch below is otherwise case-sensitive and would silently fall through.
  switch (env.otpProvider.toLowerCase()) {
    case "textlk":
      return new TextLkProvider();
    case "notifylk":
      return new NotifyLkProvider();
    case "console":
    default:
      return new ConsoleOtpProvider();
  }
}

export const otpProvider = buildOtpProvider();
export * from "./OtpProvider";
