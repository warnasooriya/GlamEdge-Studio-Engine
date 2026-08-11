import { api } from "./client";
import { Tenant } from "@/types";

export type UpdateTenantInput = Partial<
  Pick<
    Tenant,
    | "salonName"
    | "ownerName"
    | "address"
    | "mapLink"
    | "contactPhone"
    | "paypalEmail"
    | "openTime"
    | "closeTime"
    | "workingDays"
  >
> & { latitude?: number; longitude?: number };

export async function updateTenant(input: UpdateTenantInput) {
  const { data } = await api.patch<{ success: boolean; tenant: Tenant }>("/api/tenants/me", input);
  return data.tenant;
}

export async function uploadTenantLogo(file: { uri: string; name: string; type: string }) {
  const form = new FormData();
  form.append("logo", file as unknown as Blob);
  const { data } = await api.post<{ success: boolean; tenant: Tenant }>("/api/tenants/me/logo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.tenant;
}

export function tenantQrCodeUrl(baseUrl: string) {
  return `${baseUrl}/api/tenants/me/qrcode`;
}
