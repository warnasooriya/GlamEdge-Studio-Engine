import { api } from "./client";
import { Tenant } from "@/types";

export async function requestOtp(phone: string) {
  const { data } = await api.post<{ success: boolean; message: string }>("/api/auth/otp/request", { phone });
  return data;
}

interface VerifyOtpResult {
  success: boolean;
  pendingApproval?: boolean;
  message?: string;
  token?: string;
  tenant?: Tenant;
}

export async function verifyOtp(input: { phone: string; code: string; salonName?: string; ownerName?: string }) {
  const { data } = await api.post<VerifyOtpResult>("/api/auth/otp/verify", input);
  return data;
}

export async function getMe() {
  const { data } = await api.get<{ success: boolean; tenant: Tenant }>("/api/auth/me");
  return data.tenant;
}

export async function deleteAccount() {
  const { data } = await api.delete<{ success: boolean; message: string }>("/api/auth/account");
  return data;
}
