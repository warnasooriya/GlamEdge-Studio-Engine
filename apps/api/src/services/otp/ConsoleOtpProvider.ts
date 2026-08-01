import { OtpProvider } from "./OtpProvider";

export class ConsoleOtpProvider implements OtpProvider {
  async send(phone: string, code: string): Promise<void> {
    console.log(`[otp:dev-stub] OTP for ${phone} is ${code} (no SMS sent — set OTP_PROVIDER to send real SMS)`);
  }
}
