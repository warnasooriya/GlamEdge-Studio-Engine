import { env } from "@/config/env";
import { OtpProvider } from "./OtpProvider";
import { ConsoleOtpProvider } from "./ConsoleOtpProvider";
import { NotifyLkProvider } from "./NotifyLkProvider";
import { TextLkProvider } from "./TextLkProvider";

function buildOtpProvider(): OtpProvider {
  switch (env.otpProvider) {
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
