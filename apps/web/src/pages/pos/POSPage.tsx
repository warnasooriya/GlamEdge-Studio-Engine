import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Receipt, FileText, Image as ImageIcon, Copy, MessageCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/Pagination";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { WalkInSaleForm } from "@/components/pos/WalkInSaleForm";
import { useToast } from "@/components/ui/toast";
import { getSocket } from "@/lib/socket";
import { formatCurrency } from "@/lib/utils";
import { Appointment, Invoice, PaymentMode } from "@/types";

interface InvoicesResponse {
  invoices: Invoice[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AppointmentsResponse {
  appointments: Appointment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CreateInvoiceResponse {
  invoiceUrl?: string;
  receiptImageUrl?: string;
  totalAmount: number;
  whatsappSent: boolean;
  hasPhone: boolean;
  // Present instead of the receipt fields when paymentMode is PayPal — the
  // bill isn't finalized yet, the customer still has to pay via the link.
  payUrl?: string;
}

export default function POSPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [paymentModeByAppt, setPaymentModeByAppt] = useState<Record<string, PaymentMode>>({});

  const [pendingPage, setPendingPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["appointments", "unbilled", pendingPage],
    queryFn: async () =>
      (
        await api.get<AppointmentsResponse>("/api/appointments", {
          params: { page: pendingPage, pageSize: 10, isBilled: false, excludeCancelled: true },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const billable = data?.appointments || [];

  const [historyPage, setHistoryPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const from = dateFrom ? `${dateFrom}T00:00:00` : undefined;
  const to = dateTo ? `${dateTo}T23:59:59` : undefined;

  const { data: invoicesData } = useQuery({
    queryKey: ["billing", "invoices", { historyPage, from, to }],
    queryFn: async () =>
      (await api.get<InvoicesResponse>("/api/billing", { params: { page: historyPage, from, to } })).data,
    placeholderData: keepPreviousData,
  });

  const handleDateFromChange = (v: string) => {
    setDateFrom(v);
    setHistoryPage(1);
  };

  const handleDateToChange = (v: string) => {
    setDateTo(v);
    setHistoryPage(1);
  };

  const createInvoice = useMutation({
    mutationFn: async (id: string) =>
      (
        await api.post<CreateInvoiceResponse>(`/api/billing/appointments/${id}/invoice`, {
          paymentMode: paymentModeByAppt[id] || "CASH",
        })
      ).data,
    onSuccess: (data) => {
      if (data.payUrl) {
        if (data.whatsappSent) {
          toast(`PayPal payment link sent via WhatsApp — ${formatCurrency(data.totalAmount)}`, "success");
        } else if (!data.hasPhone) {
          toast(`Payment link created for ${formatCurrency(data.totalAmount)} — no phone on file, copy it to share manually.`, "success");
        } else {
          toast("Payment link created, but the WhatsApp send failed — copy it to share manually.", "error");
        }
      } else {
        if (data.whatsappSent) {
          toast(`Receipt sent via WhatsApp — ${formatCurrency(data.totalAmount)}`, "success");
        } else if (!data.hasPhone) {
          toast(`Billed ${formatCurrency(data.totalAmount)} — no phone on file, opening the receipt to share manually.`, "success");
        } else {
          toast(
            `Billed ${formatCurrency(data.totalAmount)}, but the WhatsApp send failed — opening the receipt so you can share it manually.`,
            "error"
          );
        }
        window.open(data.receiptImageUrl, "_blank");
      }
      setPendingPage(1);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Billing failed", "error"),
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handlePaymentCaptured = () => {
      toast("A customer just paid via PayPal", "success");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    };
    socket.on("payment:captured", handlePaymentCaptured);
    return () => {
      socket.off("payment:captured", handlePaymentCaptured);
    };
  }, [queryClient, toast]);

  const cancelPaypalLink = useMutation({
    mutationFn: async (id: string) => api.post(`/api/billing/appointments/${id}/paypal-link/cancel`),
    onSuccess: () => {
      toast("Payment link cancelled — you can bill this normally now", "success");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to cancel payment link", "error"),
  });

  async function handleCopyPayLink(paymentId: string) {
    const url = `${window.location.origin}/pay/${paymentId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Payment link copied", "success");
    } catch {
      toast(url, "success");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <WalkInSaleForm />

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
              const pendingPaypal = appt.paypalPayment?.status === "PENDING" ? appt.paypalPayment : null;
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
                  {pendingPaypal ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="amber">Awaiting PayPal payment</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleCopyPayLink(pendingPaypal.id)}>
                        <Copy className="h-3.5 w-3.5" /> Copy link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancelPaypalLink.mutate(appt.id)}
                        disabled={cancelPaypalLink.isPending}
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  ) : (
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
                        <option value="PAYPAL">PayPal</option>
                      </select>
                      <Button size="sm" variant="gold" onClick={() => createInvoice.mutate(appt.id)} disabled={createInvoice.isPending}>
                        {paymentModeByAppt[appt.id] === "PAYPAL" ? (
                          <>
                            <MessageCircle className="h-3.5 w-3.5" /> Send Pay Link
                          </>
                        ) : (
                          "Bill & Send"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-plum-300 dark:text-cream-100/40">Nothing to bill right now.</p>
          )}
          {data && (
            <div className="pt-1">
              <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPendingPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Billing History</CardTitle>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">From</label>
                <Input
                  type="date"
                  className="h-9 w-40"
                  value={dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">To</label>
                <Input
                  type="date"
                  className="h-9 w-40"
                  value={dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {invoicesData?.invoices.length ? (
            invoicesData.invoices.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <span className="font-medium text-plum-700 dark:text-cream-50">{inv.clientName}</span>
                  <p className="text-xs text-plum-400 dark:text-cream-100/50">
                    {inv.services.join(", ")} • {inv.paymentMode} • {new Date(inv.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-brand-600 dark:text-brand-300">
                    {formatCurrency(Number(inv.amount))}
                  </span>
                  <a href={inv.receiptImageUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <ImageIcon className="h-4 w-4" /> Receipt
                    </Button>
                  </a>
                  <a href={inv.invoiceUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost">
                      <FileText className="h-4 w-4" /> PDF
                    </Button>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-plum-300 dark:text-cream-100/40">No invoices for this range.</p>
          )}
          {invoicesData && (
            <div className="pt-1">
              <Pagination page={invoicesData.page} totalPages={invoicesData.totalPages} onPageChange={setHistoryPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
