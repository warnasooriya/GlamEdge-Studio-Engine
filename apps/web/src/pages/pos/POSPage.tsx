import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    <div className="p-2">
      <Card>
        <CardHeader>
          <CardTitle>One-Tap Billing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {billable.length ? (
            billable.map((appt) => {
              const total = appt.services.reduce((sum, s) => sum + Number(s.price), 0);
              return (
                <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{appt.clientName}</span>
                      <CategoryBadge category={appt.category} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {appt.services.map((s) => s.service.name).join(", ")} • {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
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
                    <Button size="sm" onClick={() => createInvoice.mutate(appt.id)} disabled={createInvoice.isPending}>
                      Bill & Send
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">Nothing to bill right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
