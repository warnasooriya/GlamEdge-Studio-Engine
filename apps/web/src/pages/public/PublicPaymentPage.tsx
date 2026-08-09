import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { CheckCircle2, XCircle, Sparkles, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { PaypalPaymentStatus } from "@/types";

interface PaymentInfo {
  id: string;
  status: PaypalPaymentStatus;
  amountLkr: number;
  amountUsd: number | null;
  salonName: string;
  logoUrl: string | null;
  clientName: string;
  services: string[];
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";

function CenteredMessage({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-gradient-hero px-4 text-center ${tone === "error" ? "text-rose-200" : "text-cream-50"}`}>
      {children}
    </div>
  );
}

export default function PublicPaymentPage() {
  const { paymentId = "" } = useParams();
  const [justCaptured, setJustCaptured] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["public-payment", paymentId],
    queryFn: async () => (await api.get<{ payment: PaymentInfo }>(`/api/payments/paypal/${paymentId}`)).data.payment,
  });

  if (isLoading) return <CenteredMessage>Loading payment details...</CenteredMessage>;
  if (error || !data) return <CenteredMessage tone="error">This payment link could not be found.</CenteredMessage>;

  const isDone = data.status === "COMPLETED" || justCaptured;
  const isCancelled = data.status === "CANCELLED" && !justCaptured;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-plum-800">
        <div className="flex flex-col items-center gap-2 text-center">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt={data.salonName} className="h-16 w-16 rounded-2xl object-cover shadow-sm" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow">
              <Sparkles className="h-7 w-7" />
            </div>
          )}
          <h1 className="font-display text-xl font-semibold text-plum-800 dark:text-cream-50">{data.salonName}</h1>
          <p className="text-sm text-plum-400 dark:text-cream-100/60">Bill for {data.clientName}</p>
        </div>

        <div className="my-5 rounded-2xl bg-cream-50 p-4 dark:bg-plum-700/40">
          <p className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Services</p>
          <p className="mb-3 text-sm text-plum-700 dark:text-cream-50">{data.services.join(", ")}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Amount due</span>
            <span className="font-display text-2xl font-bold text-plum-800 dark:text-cream-50">
              {formatCurrency(data.amountLkr)}
            </span>
          </div>
          {data.amountUsd != null && (
            <p className="mt-1 text-right text-xs text-plum-400 dark:text-cream-100/50">
              &asymp; ${data.amountUsd.toFixed(2)} USD via PayPal, at today's exchange rate
            </p>
          )}
        </div>

        {isCancelled ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <XCircle className="h-10 w-10 text-rose-400" />
            <p className="font-medium text-plum-700 dark:text-cream-50">This payment link is no longer active</p>
            <p className="text-sm text-plum-400 dark:text-cream-100/60">Please contact the salon for another way to pay.</p>
          </div>
        ) : isDone ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="font-medium text-plum-700 dark:text-cream-50">Payment received — thank you!</p>
            <p className="text-sm text-plum-400 dark:text-cream-100/60">The salon has been notified.</p>
          </div>
        ) : !PAYPAL_CLIENT_ID ? (
          <p className="text-center text-sm text-rose-500">Online payment isn't available right now. Please contact the salon.</p>
        ) : (
          <>
            <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
              <PayPalButtons
                style={{ layout: "vertical", color: "gold", shape: "pill" }}
                createOrder={async () => {
                  setCaptureError(null);
                  const res = await api.post<{ orderId: string }>(`/api/payments/paypal/${paymentId}/create-order`);
                  return res.data.orderId;
                }}
                onApprove={async () => {
                  try {
                    await api.post(`/api/payments/paypal/${paymentId}/capture-order`);
                    setJustCaptured(true);
                    refetch();
                  } catch (err: any) {
                    setCaptureError(err.response?.data?.error || "Payment could not be completed. Please try again.");
                  }
                }}
                onError={() => setCaptureError("Something went wrong with PayPal. Please try again.")}
              />
            </PayPalScriptProvider>
            {captureError && <p className="mt-3 text-center text-sm text-rose-500">{captureError}</p>}
          </>
        )}

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-plum-300 dark:text-cream-100/40">
          <ShieldCheck className="h-3.5 w-3.5" /> Secured by PayPal · Powered by GlamEdge
        </p>
      </div>
    </div>
  );
}
