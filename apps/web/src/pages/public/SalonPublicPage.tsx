import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/booking/BookingForm";
import { FeedGrid } from "@/components/feed/FeedGrid";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { Service, Staff, Tenant } from "@/types";

type Tab = "booking" | "feed" | "reviews";

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

  if (isLoading) return <div className="p-8 text-center">Loading salon...</div>;
  if (error || !data) return <div className="p-8 text-center text-red-600">Salon not found.</div>;

  const { tenant } = data;

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <header className="glass-panel mb-4 p-4 text-center">
        <h1 className="text-xl font-bold">{tenant.salonName}</h1>
        <p className="text-xs text-slate-500">Powered by GlamEdge Studio Engine</p>
      </header>

      <div className="mb-4 flex gap-2">
        <Button size="sm" variant={tab === "booking" ? "default" : "outline"} onClick={() => setTab("booking")}>
          Book Now
        </Button>
        <Button size="sm" variant={tab === "feed" ? "default" : "outline"} onClick={() => setTab("feed")}>
          Portfolio
        </Button>
        <Button size="sm" variant={tab === "reviews" ? "default" : "outline"} onClick={() => setTab("reviews")}>
          Reviews
        </Button>
      </div>

      {tab === "booking" && <BookingForm slug={slug} services={tenant.services} staff={tenant.staff} />}
      {tab === "feed" && <FeedGrid tenantId={tenant.id} />}
      {tab === "reviews" && <ReviewsSection slug={slug} />}
    </div>
  );
}
