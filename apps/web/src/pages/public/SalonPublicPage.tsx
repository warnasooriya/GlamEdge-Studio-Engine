import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarHeart, Images, Star, Sparkles, MapPin, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BookingForm } from "@/components/booking/BookingForm";
import { ClientLoginGate } from "@/components/booking/ClientLoginGate";
import { FeedGrid } from "@/components/feed/FeedGrid";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { Service, Staff, Tenant } from "@/types";

type Tab = "booking" | "feed" | "reviews";

const TABS: { key: Tab; label: string; icon: typeof CalendarHeart }[] = [
  { key: "booking", label: "Book Now", icon: CalendarHeart },
  { key: "feed", label: "Portfolio", icon: Images },
  { key: "reviews", label: "Reviews", icon: Star },
];

export default function SalonPublicPage() {
  const { slug = "" } = useParams();
  const [tab, setTab] = useState<Tab>("booking");

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-tenant", slug],
    queryFn: async () =>
      (
        await api.get<{ tenant: Tenant & { services: Service[]; staff: Staff[] } }>(
          `/api/tenants/public/${slug}`
        )
      ).data,
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

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <header className="relative overflow-hidden bg-gradient-hero px-4 pb-10 pt-12 text-center">
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 animate-float-slow rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-6 bottom-0 h-32 w-32 animate-float-slow rounded-full bg-amber-400/20 blur-3xl [animation-delay:2s]" />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.salonName} className="h-full w-full object-cover" />
            ) : (
              <Sparkles className="h-6 w-6 text-brand-300" />
            )}
          </div>
          <h1 className="font-display text-3xl font-semibold text-cream-50">{tenant.salonName}</h1>
          <p className="text-xs uppercase tracking-wide text-cream-100/60">Powered by GlamEdge Studio Engine</p>

          {(tenant.address || directionsUrl || tenant.contactPhone) && (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-cream-100/80">
              {tenant.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {tenant.address}
                </span>
              )}
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-brand-300 hover:text-brand-200 hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5" /> Get Directions
                </a>
              )}
              {tenant.contactPhone && (
                <a href={`tel:${tenant.contactPhone}`} className="flex items-center gap-1 hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {tenant.contactPhone}
                </a>
              )}
            </div>
          )}
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
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="pb-10">
          {tab === "booking" && (
            <ClientLoginGate>
              <BookingForm slug={slug} services={tenant.services} staff={tenant.staff} />
            </ClientLoginGate>
          )}
          {tab === "feed" && <FeedGrid tenantId={tenant.id} salonName={tenant.salonName} />}
          {tab === "reviews" && <ReviewsSection slug={slug} />}
        </div>
      </div>
    </div>
  );
}
