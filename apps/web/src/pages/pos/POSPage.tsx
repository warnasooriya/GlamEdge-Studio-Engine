import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { Appointment, PaymentMode } from "@/types";

export default function POSPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [paymentModeByAppt, setPaymentModeByAppt] = useState<Record<string, PaymentMode>>({});

  const { data } = useQuery({
    queryKey: ["appointments", "unbilled"],
    queryFn: async () => (await api.get<{ appointments: Appointment[] }>("/api/appointments")).data,
  });

  const billable = (data?.appointments || []).filter(
    (a) => !a.isBilled && a.status !== "CANCELLED"
  );

  const createInvoice = useMutation({
    mutationFn: async (id: string) =>
      api.post(`/api/billing/appointments/${id}/invoice`, {
        paymentMode: paymentModeByAppt[id] || "CASH",
      }),
    onSuccess: (res) => {
      toast(`Invoice generated — ${formatCurrency(res.data.totalAmount)}`, "success");
      window.open(res.data.invoiceUrl, "_blank");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Billing failed", "error"),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-gold text-white shadow-sm">
            <Receipt className="h-4.5 w-4.5" />
          </div>
          <CardTitle>One-Tap Billing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
        {billable.length ? (
          billable.map((appt) => {
            const total = appt.services.reduce((sum, s) => sum + Number(s.price), 0);
            return (
              <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-plum-700 dark:text-cream-50">{appt.clientName}</span>
                    <CategoryBadge category={appt.category} />
                  </div>
                  <p className="text-xs text-plum-400 dark:text-cream-100/50">
                    {appt.services.map((s) => s.service.name).join(", ")} •{" "}
                    <span className="font-semibold text-brand-600 dark:text-brand-300">{formatCurrency(total)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-lg border border-plum-100 bg-white/90 px-2.5 text-sm shadow-sm dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
                    value={paymentModeByAppt[appt.id] || "CASH"}
                    onChange={(e) =>
                      setPaymentModeByAppt((prev) => ({ ...prev, [appt.id]: e.target.value as PaymentMode }))
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="ONLINE">Online</option>
                    <option value="LANKAQR">LankaQR</option>
                  </select>
                  <Button size="sm" variant="gold" onClick={() => createInvoice.mutate(appt.id)} disabled={createInvoice.isPending}>
                    Bill & Send
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="py-8 text-center text-sm text-plum-300 dark:text-cream-100/40">Nothing to bill right now.</p>
        )}
      </CardContent>
    </Card>
  );
}
