import { api } from "./client";
import { AnalyticsOverview } from "@/types";

export async function getAnalyticsOverview(days: 7 | 30 | 90 = 30) {
  const { data } = await api.get<{ success: boolean } & AnalyticsOverview>("/api/analytics/overview", {
    params: { days },
  });
  return data;
}
