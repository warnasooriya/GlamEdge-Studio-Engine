import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Store } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { Service, Tenant } from "@/types";

type TenantWithServices = Pick<Tenant, "id" | "salonName" | "slug"> & { services: Service[] };

interface TenantsPage {
  tenants: TenantWithServices[];
  page: number;
  totalPages: number;
}

export default function LandingPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["public-tenants"],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      (await api.get<TenantsPage>("/api/tenants/public", { params: { page: pageParam } })).data,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const tenants = data?.pages.flatMap((p) => p.tenants) || [];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <header className="relative overflow-hidden bg-gradient-hero px-4 pb-14 pt-12 text-center">
        <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 animate-float-slow rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 animate-float-slow rounded-full bg-amber-400/20 blur-3xl [animation-delay:2s]" />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-2xl font-semibold text-cream-50">GlamEdge</span>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-cream-50">
            Discover salons on{" "}
            <span className="bg-gradient-to-r from-brand-300 to-amber-300 bg-clip-text text-transparent">
              GlamEdge
            </span>
          </h1>
          <p className="max-w-md text-cream-100/70">
            Browse studios, explore their services, and book your next appointment.
          </p>
          <Link to="/auth" className="mt-1">
            <Button variant="outline" size="sm" className="border-white/40 text-cream-50 hover:bg-white/10">
              Own a salon? Log in
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto -mt-6 max-w-4xl px-4 pb-16">
        {isLoading && (
          <p className="py-10 text-center text-sm text-plum-400 dark:text-cream-100/50">Loading salons...</p>
        )}

        {error && (
          <p className="py-10 text-center text-sm text-rose-500">Couldn't load salons — please try again.</p>
        )}

        {data && tenants.length === 0 && (
          <p className="py-10 text-center text-sm text-plum-400 dark:text-cream-100/50">
            No salons are live yet — check back soon.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-3 pb-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <CardTitle>{tenant.salonName}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                {tenant.services.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {tenant.services.slice(0, 4).map((service) => (
                      <div key={service.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1.5 text-plum-600 dark:text-cream-100/80">
                          <CategoryBadge category={service.category} />
                          {service.name}
                        </span>
                        <span className="shrink-0 font-medium text-plum-800 dark:text-cream-50">
                          {formatCurrency(Number(service.price))}
                        </span>
                      </div>
                    ))}
                    {tenant.services.length > 4 && (
                      <p className="text-xs text-plum-300 dark:text-cream-100/40">
                        +{tenant.services.length - 4} more services
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-plum-300 dark:text-cream-100/40">No services listed yet.</p>
                )}

                <Link to={`/salon/${tenant.slug}`} className="mt-auto">
                  <Button size="sm" className="w-full">
                    View salon <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {hasNextPage && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading..." : "Load more salons"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
