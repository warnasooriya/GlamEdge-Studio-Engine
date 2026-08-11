import { api } from "./client";
import { CreateInvoiceResult, Invoice, PaymentMode } from "@/types";

export async function listInvoices(params: { page?: number; from?: string; to?: string }) {
  const { data } = await api.get<{
    success: boolean;
    invoices: Invoice[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>("/api/billing", { params });
  return data;
}

export async function createInvoice(appointmentId: string, paymentMode: PaymentMode) {
  const { data } = await api.post<CreateInvoiceResult>(`/api/billing/appointments/${appointmentId}/invoice`, {
    paymentMode,
  });
  return data;
}

export async function cancelPaypalLink(appointmentId: string) {
  await api.post(`/api/billing/appointments/${appointmentId}/paypal-link/cancel`);
}
