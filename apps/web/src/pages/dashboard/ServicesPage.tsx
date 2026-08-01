import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { CategoryType, Service } from "@/types";

export default function ServicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<{ services: Service[] }>("/api/services")).data,
  });

  const { data: templatesData } = useQuery({
    queryKey: ["services", "templates"],
    queryFn: async () => (await api.get("/api/services/templates")).data,
  });

  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMin, setDurationMin] = useState("30");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["services"] });

  const createService = useMutation({
    mutationFn: async () =>
      api.post("/api/services", { category, name, price: Number(price), durationMin: Number(durationMin) }),
    onSuccess: () => {
      toast("Service added", "success");
      setName("");
      setPrice("");
      invalidate();
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to add service", "error"),
  });

  const applyTemplate = useMutation({
    mutationFn: async (tpl: (typeof templatesData.templates)[number]) => api.post("/api/services", tpl),
    onSuccess: invalidate,
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/services/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Service</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryType)}
          >
            <option value="LADIES">Ladies</option>
            <option value="GENTS">Gents</option>
            <option value="KIDS">Kids</option>
          </select>
          <Input placeholder="Service name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Price (LKR)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input placeholder="Duration (min)" type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
          <Button disabled={!name || !price || createService.isPending} onClick={() => createService.mutate()}>
            Add
          </Button>
        </CardContent>
      </Card>

      {templatesData?.templates && (
        <Card>
          <CardHeader>
            <CardTitle>Quick-add Presets</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {templatesData.templates.map((tpl: any) => (
              <Button key={tpl.name} size="sm" variant="outline" onClick={() => applyTemplate.mutate(tpl)}>
                {tpl.name} · {formatCurrency(tpl.price)}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service Menu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {data?.services?.length ? (
            data.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={s.category} />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-slate-500">({s.durationMin} min)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{formatCurrency(Number(s.price))}</span>
                  <Button size="sm" variant="ghost" onClick={() => deleteService.mutate(s.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">No services yet — add one above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
