import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, Wallet, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { LedgerEntry, LedgerType, PaymentMode } from "@/types";

interface LedgerEntriesResponse {
  entries: LedgerEntry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const SELECT_CLASS =
  "h-10 rounded-lg border border-plum-100 bg-white/90 px-2.5 text-sm shadow-sm dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50";

export default function DashboardHome() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reconciliation } = useQuery({
    queryKey: ["ledger", "reconciliation"],
    queryFn: async () => (await api.get("/api/ledger/reconciliation")).data,
  });

  const [entriesPage, setEntriesPage] = useState(1);

  const { data: entriesData } = useQuery({
    queryKey: ["ledger", "entries", entriesPage],
    queryFn: async () =>
      (await api.get<LedgerEntriesResponse>("/api/ledger", { params: { page: entriesPage } })).data,
    placeholderData: keepPreviousData,
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
      setEntriesPage(1);
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to add entry", "error"),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          label="Net Profit Today"
          value={formatCurrency(reconciliation?.netProfit ?? 0)}
          icon={TrendingUp}
          tone="brand"
        />
        <SummaryCard
          label="Income"
          value={formatCurrency(reconciliation?.totalIncome ?? 0)}
          icon={ArrowUpCircle}
          tone="emerald"
        />
        <SummaryCard
          label="Expenses"
          value={formatCurrency(reconciliation?.totalExpense ?? 0)}
          icon={ArrowDownCircle}
          tone="rose"
        />
        <SummaryCard
          label="Cash Drawer"
          value={formatCurrency(reconciliation?.cashDrawer ?? 0)}
          icon={Wallet}
          tone="gold"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Ledger Entry</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <select className={SELECT_CLASS} value={type} onChange={(e) => setType(e.target.value as LedgerType)}>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <Input placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input placeholder="Category (e.g. utility bill)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <select
            className={SELECT_CLASS}
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
            <Plus className="h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {entriesData?.entries?.length ? (
            entriesData.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-plum-700 dark:text-cream-50">{entry.category}</p>
                  <p className="text-xs text-plum-300 dark:text-cream-100/50">
                    {entry.paymentMode} • {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={cn("font-semibold", entry.type === "INCOME" ? "text-emerald-600" : "text-rose-600")}>
                  {entry.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(Number(entry.amount))}
                </span>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">No ledger entries yet</p>
          )}
          {entriesData && (
            <div className="pt-1">
              <Pagination page={entriesData.page} totalPages={entriesData.totalPages} onPageChange={setEntriesPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const TONE_CLASSES: Record<string, string> = {
  brand: "bg-gradient-brand text-white",
  emerald: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  rose: "bg-gradient-to-br from-rose-400 to-rose-600 text-white",
  gold: "bg-gradient-gold text-white",
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm", TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-plum-400 dark:text-cream-100/50">{label}</p>
          <p className="truncate font-display text-lg font-semibold text-plum-800 dark:text-cream-50">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
