import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, cn } from "@/lib/utils";
import { CategoryType, Service, Staff } from "@/types";

const ALL_CATEGORIES: CategoryType[] = ["LADIES", "GENTS", "KIDS"];

const SELECT_CLASS =
  "h-10 rounded-lg border border-plum-100 bg-white/90 px-2.5 text-sm shadow-sm dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50";

interface ServicesResponse {
  services: Service[];
}

interface StaffResponse {
  staff: Staff[];
}

export function WalkInSaleForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servicesData } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<ServicesResponse>("/api/services")).data,
  });
  const { data: staffData } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await api.get<StaffResponse>("/api/staff")).data,
  });

  const services = servicesData?.services || [];
  const staff = staffData?.staff || [];

  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const categoryServices = services.filter((s) => s.category === category);
  const total = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.price), 0);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const createWalkIn = useMutation({
    mutationFn: async () =>
      api.post("/api/appointments/walk-in", {
        clientName: clientName.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        category,
        staffId: staffId || undefined,
        serviceIds: selectedServiceIds,
      }),
    onSuccess: () => {
      toast("Walk-in added — ready to bill below", "success");
      setSelectedServiceIds([]);
      setStaffId("");
      setClientName("");
      setClientPhone("");
      queryClient.invalidateQueries({ queryKey: ["appointments", "unbilled"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to add walk-in", "error"),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-sm">
            <UserPlus className="h-4.5 w-4.5" />
          </div>
          <CardTitle>New Walk-in Sale</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          {ALL_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full transition-transform",
                category === c ? "scale-105 ring-2 ring-brand-400 ring-offset-2 ring-offset-transparent" : "opacity-60"
              )}
            >
              <CategoryBadge category={c} />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryServices.length ? (
            categoryServices.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleService(s.id)}
                className={cn(
                  "rounded-full border-2 px-3.5 py-1.5 text-xs font-medium transition-all",
                  selectedServiceIds.includes(s.id)
                    ? "border-transparent bg-gradient-brand text-white shadow-glow"
                    : "border-plum-100 text-plum-500 hover:border-brand-300 dark:border-white/10 dark:text-cream-100/70"
                )}
              >
                {s.name} · {formatCurrency(Number(s.price))}
              </button>
            ))
          ) : (
            <p className="text-xs text-plum-300 dark:text-cream-100/40">No services in this category yet.</p>
          )}
        </div>

        {selectedServiceIds.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm dark:bg-white/5">
            <span className="text-plum-500 dark:text-cream-100/70">
              {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? "s" : ""} selected
            </span>
            <span className="font-semibold text-brand-600 dark:text-brand-300">{formatCurrency(total)}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Input
            placeholder="Client name (optional — defaults to Walking Customer)"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <Input
            placeholder="Phone (optional — for WhatsApp receipt)"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
          <select className={SELECT_CLASS} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">Unassigned staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        <Button
          disabled={selectedServiceIds.length === 0 || createWalkIn.isPending}
          onClick={() => createWalkIn.mutate()}
          className="self-start"
        >
          Add Walk-in
        </Button>
      </CardContent>
    </Card>
  );
}
