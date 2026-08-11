import { api } from "./client";
import { Appointment, CustomerSummary, PaginatedResponse, Review } from "@/types";

export async function listCustomers(page = 1) {
  const { data } = await api.get<{ success: boolean; clients: CustomerSummary[] } & PaginatedResponse<CustomerSummary>>(
    "/api/clients",
    { params: { page } }
  );
  return data;
}

export async function getCustomerDetail(id: string) {
  const { data } = await api.get<{
    success: boolean;
    client: { id: string; name: string; phone: string; createdAt: string };
    appointments: Appointment[];
    reviews: Review[];
  }>(`/api/clients/${id}`);
  return data;
}
