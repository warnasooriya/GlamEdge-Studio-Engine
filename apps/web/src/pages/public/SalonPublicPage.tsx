import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarHeart, Images, Star, Sparkles, MapPin, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/booking/BookingForm";
import { ClientLoginGate } from "@/components/booking/ClientLoginGate";
import { FeedGrid } from "@/components/feed/FeedGrid";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { FeedPost, Service, Staff, Tenant } from "@/types";

type Tab = "feed" | "booking" | "reviews";

const TABS: { key: Tab; label: string; icon: typeof CalendarHeart }[] = [
  { key: "feed", label: "Portfolio", icon: Images },
  { key: "booking", label: "Book Now", icon: CalendarHeart },
  { key: "reviews", label: "Reviews", icon: Star },
];

interface ReviewsSummary {
  avgRating: number;
  count: number;
}

interface FeedResponse {
  posts: FeedPost[];
  total: number;
}

export default function SalonPublicPage() {
  const { slug = "" } = useParams();
  const [tab, setTab] = useState<Tab>("feed");

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-tenant", slug],
    queryFn: async () =>
      (
        await api.get<{ tenant: Tenant & { services: Service[]; staff: Staff[] } }>(
          `/api/tenants/public/${slug}`
        )
      ).data,
  });

  const tenantId = data?.tenant.id;

  const { data: reviewSummary } = useQuery({
    queryKey: ["public-reviews-summary", slug],
    queryFn: async () => (await api.get<ReviewsSummary>(`/api/reviews/public/${slug}`, { params: { pageSize: 1 } })).data,
    enabled: !!tenantId,
  });

  const { data: coverData } = useQuery({
    queryKey: ["public-feed-cover", tenantId],
    queryFn: async () => (await api.get<FeedResponse>("/api/feed/public", { params: { tenantId, limit: 1 } })).data,
    enabled: !!tenantId,
  });

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero text-cream-50">
        Loading salon...
      </div>
    );
  if (error || !data)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero text-rose-200">
        Salon not found.
      </div>
    );

  const { tenant } = data;
  const directionsUrl =
    tenant.latitude != null && tenant.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${tenant.latitude},${tenant.longitude}`
      : tenant.mapLink || null;

  const coverImage = coverData?.posts[0]?.media.find((m) => m.type === "image")?.url;
  const portfolioCount = coverData?.total ?? 0;

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <header className="relative overflow-hidden bg-gradient-hero px-4 pb-16 pt-14 text-center">
        {coverImage && (
          <img
            src={coverImage}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-sm"
          />
        )}
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 animate-float-slow rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-6 bottom-0 h-32 w-32 animate-float-slow rounded-full bg-amber-400/20 blur-3xl [animation-delay:2s]" />

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/10 shadow-xl ring-4 ring-white/15">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.salonName} className="h-full w-full object-cover" />
            ) : (
              <Sparkles className="h-8 w-8 text-brand-300" />
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl font-semibold text-cream-50 md:text-4xl">{tenant.salonName}</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cream-100/50">Salon &amp; Beauty Studio</p>
          </div>

          {reviewSummary && reviewSummary.count > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm text-cream-50 backdrop-blur-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{reviewSummary.avgRating.toFixed(1)}</span>
              <span className="text-cream-100/60">
                ({reviewSummary.count} review{reviewSummary.count === 1 ? "" : "s"})
              </span>
            </div>
          )}

          {(tenant.address || directionsUrl || tenant.contactPhone) && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-cream-100/80">
              {tenant.address && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {tenant.address}
                </span>
              )}
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-brand-300 hover:bg-white/10 hover:text-brand-200"
                >
                  <MapPin className="h-3.5 w-3.5" /> Get Directions
                </a>
              )}
              {tenant.contactPhone && (
                <a
                  href={`tel:${tenant.contactPhone}`}
                  className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 hover:bg-white/10"
                >
                  <Phone className="h-3.5 w-3.5" /> {tenant.contactPhone}
                </a>
              )}
            </div>
          )}

          <Button size="lg" className="mt-1" onClick={() => setTab("booking")}>
            <CalendarHeart className="h-4 w-4" /> Book an Appointment
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4">
        <div className="glass-panel -mt-6 mb-5 flex gap-1 p-1.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all",
                tab === key
                  ? "bg-gradient-brand text-white shadow-glow"
                  : "text-plum-500 hover:bg-brand-50 dark:text-cream-100/70 dark:hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === "feed" && portfolioCount > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    tab === key ? "bg-white/20" : "bg-brand-100 text-brand-600 dark:bg-white/10 dark:text-cream-100"
                  )}
                >
                  {portfolioCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("mx-auto px-4", tab === "feed" ? "max-w-6xl" : "max-w-2xl")}>
        <div className="pb-32 md:pb-10">
          {tab === "feed" && <FeedGrid tenantId={tenant.id} salonName={tenant.salonName} />}
          {tab === "booking" && (
            <ClientLoginGate>
              <BookingForm slug={slug} services={tenant.services} staff={tenant.staff} />
            </ClientLoginGate>
          )}
          {tab === "reviews" && <ReviewsSection slug={slug} />}
        </div>
      </div>

      {tab !== "booking" && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-cream-50 to-transparent p-3 pt-8 dark:from-plum-900 md:hidden">
          <Button size="lg" className="w-full max-w-sm shadow-xl" onClick={() => setTab("booking")}>
            <CalendarHeart className="h-4 w-4" /> Book an Appointment
          </Button>
        </div>
      )}
    </div>
  );
}
