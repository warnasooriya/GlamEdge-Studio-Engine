import { api } from "./client";
import { CategoryType, Service } from "@/types";

export async function listServices() {
  const { data } = await api.get<{ success: boolean; services: Service[] }>("/api/services");
  return data.services;
}

export async function createService(input: { category: CategoryType; name: string; price: number; durationMin?: number }) {
  const { data } = await api.post<{ success: boolean; service: Service }>("/api/services", input);
  return data.service;
}

export async function deleteService(id: string) {
  await api.delete(`/api/services/${id}`);
}
