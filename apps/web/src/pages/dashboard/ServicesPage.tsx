import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { CategoryType, Service } from "@/types";

interface ServiceTemplate {
  category: CategoryType;
  name: string;
  price: number;
  durationMin: number;
}

interface TemplatesResponse {
  templates: ServiceTemplate[];
  page: number;
  totalPages: number;
}

export default function ServicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get<{ services: Service[] }>("/api/services")).data,
  });

  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMin, setDurationMin] = useState("30");
  const [templateSearchInput, setTemplateSearchInput] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<CategoryType | "ALL">("ALL");
  const addFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setTemplateSearch(templateSearchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [templateSearchInput]);

  const {
    data: templatesData,
    fetchNextPage: fetchNextTemplates,
    hasNextPage: hasMoreTemplates,
    isFetchingNextPage: isFetchingMoreTemplates,
  } = useInfiniteQuery({
    queryKey: ["services", "templates", templateSearch, templateCategory],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      (
        await api.get<TemplatesResponse>("/api/services/templates", {
          params: { page: pageParam, search: templateSearch || undefined, category: templateCategory },
        })
      ).data,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const filteredTemplates = templatesData?.pages.flatMap((p) => p.templates) || [];

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

  const deleteService = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/services/${id}`),
    onSuccess: () => {
      toast("Service removed", "success");
      invalidate();
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to remove service", "error"),
  });

  function loadTemplateIntoForm(tpl: ServiceTemplate) {
    setCategory(tpl.category);
    setName(tpl.name);
    setPrice(String(tpl.price));
    setDurationMin(String(tpl.durationMin));
    addFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card ref={addFormRef}>
        <CardHeader>
          <CardTitle>Add Service</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <select
            className="h-10 rounded-lg border border-plum-100 bg-white/90 px-2.5 text-sm shadow-sm dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
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

      <Card>
        <CardHeader>
          <CardTitle>Quick-add Presets</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-plum-300" />
              <Input
                value={templateSearchInput}
                onChange={(e) => setTemplateSearchInput(e.target.value)}
                placeholder="Search presets..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              {(["ALL", "LADIES", "GENTS", "KIDS"] as const).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={templateCategory === c ? "default" : "outline"}
                  onClick={() => setTemplateCategory(c)}
                >
                  {c === "ALL" ? "All" : c === "LADIES" ? "Ladies" : c === "GENTS" ? "Gents" : "Kids"}
                </Button>
              ))}
            </div>
          </div>
          {filteredTemplates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredTemplates.map((tpl) => (
                <Button
                  key={tpl.name}
                  size="sm"
                  variant="outline"
                  onClick={() => loadTemplateIntoForm(tpl)}
                  title="Load into Add Service — you can change price and duration before adding"
                >
                  {tpl.name} · {formatCurrency(tpl.price)}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-plum-300 dark:text-cream-100/40">No presets match this filter.</p>
          )}
          {hasMoreTemplates && (
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => fetchNextTemplates()}
              disabled={isFetchingMoreTemplates}
            >
              {isFetchingMoreTemplates ? "Loading..." : "Load more presets"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Menu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {data?.services?.length ? (
            data.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={s.category} />
                  <span className="font-medium text-plum-700 dark:text-cream-50">{s.name}</span>
                  <span className="text-plum-300 dark:text-cream-100/50">({s.durationMin} min)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-brand-600 dark:text-brand-300">{formatCurrency(Number(s.price))}</span>
                  <Button size="sm" variant="ghost" onClick={() => deleteService.mutate(s.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">No services yet — add one above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
