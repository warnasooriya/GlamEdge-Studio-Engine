import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { LedgerEntry, LedgerType, PaymentMode } from "@/types";

export default function DashboardHome() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reconciliation } = useQuery({
    queryKey: ["ledger", "reconciliation"],
    queryFn: async () => (await api.get("/api/ledger/reconciliation")).data,
  });

  const { data: entriesData } = useQuery({
    queryKey: ["ledger", "entries"],
    queryFn: async () => (await api.get<{ entries: LedgerEntry[] }>("/api/ledger")).data,
  });

  const [type, setType] = useState<LedgerType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");

  const createEntry = useMutation({
    mutationFn: async () =>
      api.post("/api/ledger", { type, amount: Number(amount), category, paymentMode }),
    onSuccess: () => {
      toast("Ledger entry added", "success");
      setAmount("");
      setCategory("");
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to add entry", "error"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Net Profit Today" value={formatCurrency(reconciliation?.netProfit ?? 0)} />
        <SummaryCard label="Income" value={formatCurrency(reconciliation?.totalIncome ?? 0)} />
        <SummaryCard label="Expenses" value={formatCurrency(reconciliation?.totalExpense ?? 0)} />
        <SummaryCard label="Cash Drawer" value={formatCurrency(reconciliation?.cashDrawer ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Ledger Entry</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={type}
            onChange={(e) => setType(e.target.value as LedgerType)}
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <Input placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input placeholder="Category (e.g. utility bill)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="ONLINE">Online</option>
            <option value="LANKAQR">LankaQR</option>
          </select>
          <Button
            onClick={() => createEntry.mutate()}
            disabled={!amount || !category || createEntry.isPending}
          >
            Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {entriesData?.entries?.length ? (
            entriesData.entries.slice(0, 15).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{entry.category}</p>
                  <p className="text-xs text-slate-500">
                    {entry.paymentMode} • {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={entry.type === "INCOME" ? "text-emerald-600" : "text-red-600"}>
                  {entry.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(Number(entry.amount))}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">No ledger entries yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
