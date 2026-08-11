import { api } from "./client";
import { LedgerEntry, LedgerReconciliation, LedgerType, PaymentMode } from "@/types";

export async function getReconciliation(date?: string) {
  const { data } = await api.get<{ success: boolean } & LedgerReconciliation>("/api/ledger/reconciliation", {
    params: date ? { date } : undefined,
  });
  return data;
}

export async function listLedgerEntries(page = 1) {
  const { data } = await api.get<{
    success: boolean;
    entries: LedgerEntry[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>("/api/ledger", { params: { page } });
  return data;
}

export async function createLedgerEntry(input: {
  type: LedgerType;
  amount: number;
  category: string;
  paymentMode: PaymentMode;
  description?: string;
}) {
  const { data } = await api.post<{ success: boolean; entry: LedgerEntry }>("/api/ledger", input);
  return data.entry;
}
