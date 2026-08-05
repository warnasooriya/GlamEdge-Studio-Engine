import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Search,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  PauseCircle,
  RotateCcw,
  RefreshCw,
  Wallet,
  Save,
  Plus,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Pagination } from "@/components/shared/Pagination";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { Tenant, TenantStatus, SubscriptionCycle, SubscriptionPayment, PaymentMode } from "@/types";

interface TenantsResponse {
  tenants: Tenant[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface TenantPaymentsResponse {
  payments: SubscriptionPayment[];
  totalPaid: string;
  page: number;
  total: number;
  totalPages: number;
}

const STATUS_TABS: { value: TenantStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

const STATUS_VARIANT: Record<TenantStatus, BadgeProps["variant"]> = {
  PENDING: "amber",
  APPROVED: "success",
  REJECTED: "outline",
  SUSPENDED: "navy",
};

const PAYMENT_MODES: PaymentMode[] = ["CASH", "CARD", "ONLINE", "LANKAQR"];

/** Mirrors PLAN_PRICING on the API so switching plan shows the new list rate
 *  immediately — the admin can still type a custom fee over it before saving. */
const PLAN_PRICING: Record<Tenant["subscription"], Record<SubscriptionCycle, number>> = {
  STARTER: { MONTHLY: 2500, YEARLY: 25000 },
  PRO: { MONTHLY: 5000, YEARLY: 50000 },
  ENTERPRISE: { MONTHLY: 12000, YEARLY: 120000 },
};

/** Days until expiry drives the colour of the renewal line — expired reads red, the
 *  final week amber, everything else stays quiet. */
function expiryTone(expiresAt?: string | null) {
  if (!expiresAt) return { label: "No expiry set", className: "text-plum-300 dark:text-cream-100/40" };
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  const date = new Date(expiresAt).toLocaleDateString();
  if (days < 0) return { label: `Expired ${date}`, className: "text-red-600 dark:text-red-400 font-semibold" };
  if (days <= 7)
    return { label: `Expires in ${days}d · ${date}`, className: "text-amber-600 dark:text-amber-400 font-semibold" };
  return { label: `Renews ${date}`, className: "text-plum-400 dark:text-cream-100/50" };
}

export default function AdminTenantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get("status") as TenantStatus | "ALL") || "ALL";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data } = useQuery({
    queryKey: ["admin-tenants", status, search, page],
    queryFn: async () =>
      (
        await adminApi.get<TenantsResponse>("/api/admin/tenants", {
          params: { status, search: search || undefined, page },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const tenants = data?.tenants || [];
  const selected = tenants.find((t) => t.id === selectedId) || null;

  function setStatus(next: TenantStatus | "ALL") {
    setSearchParams(next === "ALL" ? {} : { status: next });
    setPage(1);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const approveMutation = useMutation({
    mutationFn: async (id: string) => adminApi.post(`/api/admin/tenants/${id}/approve`),
    onSuccess: () => {
      toast("Salon approved", "success");
      invalidate();
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to approve", "error"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      adminApi.post(`/api/admin/tenants/${id}/reject`, { reason }),
    onSuccess: () => {
      toast("Salon rejected", "success");
      setShowRejectFor(null);
      setRejectReason("");
      invalidate();
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to reject", "error"),
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => adminApi.post(`/api/admin/tenants/${id}/suspend`),
    onSuccess: () => {
      toast("Salon suspended", "success");
      invalidate();
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to suspend", "error"),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => adminApi.post(`/api/admin/tenants/${id}/reactivate`),
    onSuccess: () => {
      toast("Salon reactivated", "success");
      invalidate();
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to reactivate", "error"),
  });

  const subscriptionMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      subscription?: string;
      subscriptionCycle?: SubscriptionCycle;
      subscriptionFee?: number;
      renew?: boolean;
    }) => {
      const { id, ...body } = payload;
      return adminApi.patch(`/api/admin/tenants/${id}/subscription`, body);
    },
    onSuccess: () => {
      toast("Subscription updated", "success");
      invalidate();
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to update subscription", "error"),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Salons</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 overflow-x-auto rounded-full bg-plum-50 p-1 dark:bg-white/5">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatus(tab.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    status === tab.value
                      ? "bg-plum-700 text-white shadow-sm"
                      : "text-plum-500 hover:bg-white dark:text-cream-100/70 dark:hover:bg-white/10"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-plum-300" />
              <Input
                placeholder="Search by salon, owner, or phone"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {tenants.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tenants.map((t) => {
                const expiry = expiryTone(t.subscriptionExpiresAt);
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className="flex flex-col gap-3 rounded-xl border border-plum-100 bg-white/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-semibold text-plum-800 dark:text-cream-50">
                          {t.salonName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-plum-400 dark:text-cream-100/50">
                          <User className="h-3 w-3 shrink-0" /> {t.ownerName}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-plum-400 dark:text-cream-100/50">
                          <Phone className="h-3 w-3 shrink-0" /> {t.phone}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[t.status]} className="shrink-0">
                        {t.status}
                      </Badge>
                    </div>

                    <div className="mt-auto flex flex-col gap-1 border-t border-plum-100 pt-2.5 dark:border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-plum-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-plum-600 dark:bg-white/10 dark:text-cream-100/70">
                          {t.subscription} · {t.subscriptionCycle.toLowerCase()}
                        </span>
                        <span className="font-semibold tabular-nums text-plum-700 dark:text-cream-50">
                          {formatCurrency(Number(t.subscriptionFee))}
                        </span>
                      </div>
                      <p className={cn("text-[11px]", expiry.className)}>{expiry.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-plum-300 dark:text-cream-100/40">No salons found.</p>
          )}

          {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          {selected && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle>{selected.salonName}</DialogTitle>
                  <Badge variant={STATUS_VARIANT[selected.status]}>{selected.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-plum-400 dark:text-cream-100/50">
                  {selected.ownerName} • {selected.phone}
                </p>
                {selected.rejectionReason && (
                  <p className="mt-1 text-xs text-red-500">Rejection reason: {selected.rejectionReason}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.status !== "APPROVED" && (
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(selected.id)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </Button>
                )}
                {selected.status !== "REJECTED" && (
                  <Button size="sm" variant="destructive" onClick={() => setShowRejectFor(selected.id)}>
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                )}
                {selected.status === "APPROVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => suspendMutation.mutate(selected.id)}
                    disabled={suspendMutation.isPending}
                  >
                    <PauseCircle className="h-3.5 w-3.5" /> Suspend
                  </Button>
                )}
                {selected.status === "SUSPENDED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reactivateMutation.mutate(selected.id)}
                    disabled={reactivateMutation.isPending}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                  </Button>
                )}
              </div>

              {showRejectFor === selected.id && (
                <div className="flex flex-col gap-2 rounded-lg border border-red-200 p-3 dark:border-red-500/30">
                  <Textarea
                    placeholder="Reason for rejection (optional, shared with the salon)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate({ id: selected.id, reason: rejectReason })}
                      disabled={rejectMutation.isPending}
                    >
                      Confirm reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowRejectFor(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <SubscriptionPanel
                tenant={selected}
                onSave={(payload) => subscriptionMutation.mutate({ id: selected.id, ...payload })}
                saving={subscriptionMutation.isPending}
              />

              <PaymentsPanel tenantId={selected.id} suggestedAmount={Number(selected.subscriptionFee)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriptionPanel({
  tenant,
  onSave,
  saving,
}: {
  tenant: Tenant;
  onSave: (payload: {
    subscription?: string;
    subscriptionCycle?: SubscriptionCycle;
    subscriptionFee?: number;
    renew?: boolean;
  }) => void;
  saving: boolean;
}) {
  const [tier, setTier] = useState(tenant.subscription);
  const [cycle, setCycle] = useState<SubscriptionCycle>(tenant.subscriptionCycle);
  const [fee, setFee] = useState(String(Number(tenant.subscriptionFee)));

  // Re-sync when the tenant data refreshes (e.g. after a save or a renewal).
  useEffect(() => {
    setTier(tenant.subscription);
    setCycle(tenant.subscriptionCycle);
    setFee(String(Number(tenant.subscriptionFee)));
  }, [tenant.id, tenant.subscription, tenant.subscriptionCycle, tenant.subscriptionFee]);

  function changeTier(next: Tenant["subscription"]) {
    setTier(next);
    setFee(String(PLAN_PRICING[next][cycle]));
  }

  function changeCycle(next: SubscriptionCycle) {
    setCycle(next);
    setFee(String(PLAN_PRICING[tier][next]));
  }

  const dirty =
    tier !== tenant.subscription ||
    cycle !== tenant.subscriptionCycle ||
    Number(fee) !== Number(tenant.subscriptionFee);

  return (
    <div className="rounded-lg border border-plum-100 p-3 dark:border-white/10">
      <h4 className="mb-2 text-sm font-semibold text-plum-700 dark:text-cream-50">Subscription</h4>
      <div className="grid grid-cols-2 gap-2 text-xs text-plum-400 dark:text-cream-100/50">
        <span>
          Started:{" "}
          {tenant.subscriptionStartedAt ? new Date(tenant.subscriptionStartedAt).toLocaleDateString() : "—"}
        </span>
        <span>
          Expires:{" "}
          {tenant.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt).toLocaleDateString() : "—"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-plum-400 dark:text-cream-100/50">Plan</span>
          <select
            className="h-9 rounded-lg border border-plum-100 bg-white/90 px-2 text-xs dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
            value={tier}
            onChange={(e) => changeTier(e.target.value as Tenant["subscription"])}
          >
            <option value="STARTER">Starter</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-plum-400 dark:text-cream-100/50">Billing cycle</span>
          <select
            className="h-9 rounded-lg border border-plum-100 bg-white/90 px-2 text-xs dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
            value={cycle}
            onChange={(e) => changeCycle(e.target.value as SubscriptionCycle)}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-plum-400 dark:text-cream-100/50">Fee (LKR)</span>
          <Input
            type="number"
            min={0}
            step="0.01"
            className="h-9 text-xs"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => onSave({ subscription: tier, subscriptionCycle: cycle, subscriptionFee: Number(fee) })}
          disabled={saving || !dirty}
        >
          <Save className="h-3.5 w-3.5" /> Save changes
        </Button>
        <Button size="sm" variant="gold" onClick={() => onSave({ renew: true })} disabled={saving}>
          <RefreshCw className="h-3.5 w-3.5" /> Extend one cycle
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-plum-300 dark:text-cream-100/40">
        Switching plan or cycle fills in that plan's list rate — edit the fee to charge this salon something
        different.
      </p>
    </div>
  );
}

function PaymentsPanel({ tenantId, suggestedAmount }: { tenantId: string; suggestedAmount: number }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [extendSubscription, setExtendSubscription] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => setAmount(String(suggestedAmount)), [suggestedAmount]);

  const { data } = useQuery({
    queryKey: ["admin-tenant-payments", tenantId],
    queryFn: async () =>
      (await adminApi.get<TenantPaymentsResponse>(`/api/admin/tenants/${tenantId}/payments`)).data,
  });

  const recordMutation = useMutation({
    mutationFn: async () =>
      adminApi.post(`/api/admin/tenants/${tenantId}/payments`, {
        amount: Number(amount),
        paymentMode,
        reference: reference || undefined,
        notes: notes || undefined,
        extendSubscription,
      }),
    onSuccess: () => {
      toast("Payment recorded", "success");
      setShowForm(false);
      setReference("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-payments", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to record payment", "error"),
  });

  const payments = data?.payments || [];

  return (
    <div className="rounded-lg border border-plum-100 p-3 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-plum-700 dark:text-cream-50">
          <Wallet className="h-4 w-4" /> Payments
        </h4>
        <Button size="sm" variant={showForm ? "ghost" : "default"} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : <><Plus className="h-3.5 w-3.5" /> Record payment</>}
        </Button>
      </div>

      <p className="text-xs text-plum-400 dark:text-cream-100/50">
        Total collected:{" "}
        <span className="font-semibold tabular-nums text-plum-700 dark:text-cream-50">
          {formatCurrency(Number(data?.totalPaid ?? 0))}
        </span>{" "}
        across {data?.total ?? 0} recorded payment{data?.total === 1 ? "" : "s"}
      </p>

      {showForm && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-400/30 dark:bg-white/5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-plum-400 dark:text-cream-100/50">Amount (LKR)</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="h-9 text-xs"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-plum-400 dark:text-cream-100/50">Method</span>
              <select
                className="h-9 rounded-lg border border-plum-100 bg-white/90 px-2 text-xs dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Input
            placeholder="Reference / receipt no. (optional)"
            className="h-9 text-xs"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <Input
            placeholder="Notes (optional)"
            className="h-9 text-xs"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-plum-500 dark:text-cream-100/70">
            <input
              type="checkbox"
              checked={extendSubscription}
              onChange={(e) => setExtendSubscription(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-500"
            />
            Extend the subscription by one cycle
          </label>
          <Button
            size="sm"
            onClick={() => recordMutation.mutate()}
            disabled={recordMutation.isPending || !amount || Number(amount) < 0}
          >
            {recordMutation.isPending ? "Saving..." : "Save payment"}
          </Button>
        </div>
      )}

      <div className="mt-3 flex flex-col divide-y divide-plum-100 dark:divide-white/10">
        {payments.length ? (
          payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start justify-between gap-2 py-2 text-xs">
              <div>
                <p className="font-medium text-plum-700 dark:text-cream-50">
                  {new Date(p.paidAt).toLocaleDateString()} · {p.paymentMode}
                  {p.reference && <span className="text-plum-400 dark:text-cream-100/50"> · {p.reference}</span>}
                </p>
                <p className="text-plum-400 dark:text-cream-100/50">
                  {p.tier} {p.cycle.toLowerCase()} · covers {new Date(p.periodStart).toLocaleDateString()} –{" "}
                  {new Date(p.periodEnd).toLocaleDateString()}
                </p>
                {p.notes && <p className="text-plum-400 dark:text-cream-100/50">{p.notes}</p>}
              </div>
              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(Number(p.amount))}
              </span>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-xs text-plum-300 dark:text-cream-100/40">
            No payments recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
