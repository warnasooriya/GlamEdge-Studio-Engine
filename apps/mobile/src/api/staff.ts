import { api } from "./client";
import { Staff } from "@/types";

export async function listStaff() {
  const { data } = await api.get<{ success: boolean; staff: Staff[] }>("/api/staff");
  return data.staff;
}

export async function createStaff(input: { name: string; phone?: string; role?: string; commission?: number }) {
  const { data } = await api.post<{ success: boolean; staff: Staff }>("/api/staff", input);
  return data.staff;
}

export async function deleteStaff(id: string) {
  await api.delete(`/api/staff/${id}`);
}
