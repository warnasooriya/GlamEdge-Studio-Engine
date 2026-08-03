import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Sparkles,
  ArrowRight,
  Store,
  Search,
  MapPin,
  LocateFixed,
  X,
  UserCircle,
  CalendarCheck,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { PortfolioLightbox } from "@/components/shared/PortfolioLightbox";
import { Service, Tenant } from "@/types";

type SortMode = "rating" | "price_asc" | "price_desc" | "name";

type TenantWithServices = Pick<Tenant, "id" | "salonName" | "slug" | "logoUrl"> & {
  address?: string | null;
  distanceKm?: number;
  avgRating: number;
  reviewCount: number;
  startingPrice: number | null;
  portfolioPreview: string[];
  portfolioCount: number;
  services: Service[];
};

interface TenantsPage {
  tenants: TenantWithServices[];
  page: number;
  totalPages: number;
  total: number;
  sort: string;
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function LandingPage() {
  const { toast } = useToast();
  const [qInput, setQInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [nearMe, setNearMe] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [sort, setSort] = useState<SortMode>("rating");
  const [portfolioModal, setPortfolioModal] = useState<{ tenantId: string; salonName: string } | null>(null);

  const q = useDebounced(qInput, 350);
  const location = useDebounced(locationInput, 350);

  const {
    data,
    isLoading,
    isFetching,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["public-tenants", q, nearMe ? "" : location, nearMe?.lat, nearMe?.lng, sort],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      (
        await api.get<TenantsPage>("/api/tenants/public", {
          params: {
            page: pageParam,
            q: q || undefined,
            location: nearMe ? undefined : location || undefined,
            lat: nearMe?.lat,
            lng: nearMe?.lng,
            sort,
          },
        })
      ).data,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const tenants = data?.pages.flatMap((p) => p.tenants) || [];
  const totalSalons = data?.pages[0]?.total;

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast("Geolocation isn't supported on this device", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        toast("Couldn't get your location — check location permissions", "error");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <header className="relative overflow-hidden bg-gradient-hero px-4 pb-20 pt-5">
        <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 animate-float-slow rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-1/3 h-64 w-64 animate-float-slow rounded-full bg-amber-400/20 blur-3xl [animation-delay:2s]" />
        <div className="pointer-events-none absolute left-1/3 bottom-0 h-40 w-40 animate-float-slow rounded-full bg-fuchsia-400/10 blur-3xl [animation-delay:4s]" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow sm:h-10 sm:w-10">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-cream-50 sm:text-xl">GlamEdge</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link to="/account">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 px-2.5 text-cream-50 hover:bg-white/10 sm:px-3.5"
              >
                <UserCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Customer Login</span>
                <span className="sm:hidden">Customer</span>
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="gold" size="sm" className="px-2.5 sm:px-3.5">
                <Store className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salon Owner Login</span>
                <span className="sm:hidden">Owner</span>
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 text-center sm:mt-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-cream-100/90 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            Sri Lanka's salon &amp; spa marketplace
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight text-cream-50 sm:text-5xl">
            Book your next{" "}
            <span className="bg-gradient-to-r from-brand-300 via-amber-300 to-brand-300 bg-clip-text text-transparent">
              glow-up
            </span>
          </h1>
          <p className="max-w-md text-base text-cream-100/70">
            Browse trusted studios, compare services and prices, and reserve your slot in seconds — no calls, no
            waiting.
          </p>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-cream-100/80">
            <span className="flex items-center gap-1.5">
              <Store className="h-4 w-4 text-brand-300" />
              {totalSalons ? `${totalSalons.toLocaleString()}+ salons` : "Hundreds of salons"}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="h-4 w-4 text-brand-300" />
              Instant booking
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-300" />
              Verified reviews
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-10 max-w-7xl px-4 pb-16">
        <div className="glass-panel mb-6 flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-plum-300" />
            <Input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search salon name or service (e.g. Bridal Makeup)"
              className="pl-9"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-plum-300" />
            <Input
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                if (nearMe) setNearMe(null);
              }}
              placeholder="City or area (e.g. Colombo)"
              className="pl-9"
              disabled={!!nearMe}
            />
          </div>
          {nearMe ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNearMe(null)}
              className="shrink-0 border-brand-300 text-brand-600 dark:text-brand-300"
            >
              <X className="h-3.5 w-3.5" /> Near me
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={useMyLocation} disabled={locating} className="shrink-0">
              <LocateFixed className="h-3.5 w-3.5" /> {locating ? "Locating..." : "Near me"}
            </Button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-plum-400 dark:text-cream-100/50">
            {totalSalons !== undefined ? `${totalSalons.toLocaleString()} salons` : ""}
          </p>
          {nearMe ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-300">
              <LocateFixed className="h-3.5 w-3.5" /> Sorted by distance
            </span>
          ) : (
            <label className="flex items-center gap-2 text-xs font-medium text-plum-500 dark:text-cream-100/60">
              <TrendingUp className="h-3.5 w-3.5" />
              Sort by
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="h-8 rounded-lg border border-plum-100 bg-white/90 px-2 text-xs font-medium text-plum-700 shadow-sm dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {isLoading && (
          <p className="py-10 text-center text-sm text-plum-400 dark:text-cream-100/50">Loading salons...</p>
        )}

        {error && (
          <p className="py-10 text-center text-sm text-rose-500">Couldn't load salons — please try again.</p>
        )}

        {data && tenants.length === 0 && !isFetching && (
          <p className="py-10 text-center text-sm text-plum-400 dark:text-cream-100/50">
            No salons match your search — try a different name, service, or location.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="flex flex-col overflow-hidden">
              {tenant.portfolioPreview.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPortfolioModal({ tenantId: tenant.id, salonName: tenant.salonName })}
                  className="grid grid-cols-3 gap-0.5 text-left"
                  aria-label={`View ${tenant.salonName}'s portfolio`}
                >
                  {tenant.portfolioPreview.map((url, i) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden bg-plum-100 dark:bg-plum-800"
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      {i === tenant.portfolioPreview.length - 1 && tenant.portfolioCount > 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-semibold text-white">
                          +{tenant.portfolioCount - 3}
                        </div>
                      )}
                    </div>
                  ))}
                </button>
              )}

              <CardHeader className="flex-row items-center gap-3 pb-3">
                {tenant.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.salonName}
                    className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-glow"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="truncate">{tenant.salonName}</CardTitle>
                  {(tenant.address || tenant.distanceKm !== undefined) && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-plum-400 dark:text-cream-100/50">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {tenant.distanceKm !== undefined
                          ? `${tenant.distanceKm.toFixed(1)} km away`
                          : tenant.address}
                      </span>
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                <div className="flex items-center justify-between gap-2">
                  {tenant.reviewCount > 0 ? (
                    <span className="flex items-center gap-1 text-sm font-semibold text-plum-700 dark:text-cream-50">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {tenant.avgRating.toFixed(1)}
                      <span className="font-normal text-plum-400 dark:text-cream-100/50">
                        ({tenant.reviewCount})
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-plum-300 dark:text-cream-100/40">No reviews yet</span>
                  )}
                  {tenant.startingPrice !== null && (
                    <span className="text-xs font-medium text-plum-500 dark:text-cream-100/60">
                      From {formatCurrency(tenant.startingPrice)}
                    </span>
                  )}
                </div>

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

      {portfolioModal && (
        <PortfolioLightbox
          tenantId={portfolioModal.tenantId}
          salonName={portfolioModal.salonName}
          open={!!portfolioModal}
          onOpenChange={(next) => !next && setPortfolioModal(null)}
        />
      )}
    </div>
  );
}
