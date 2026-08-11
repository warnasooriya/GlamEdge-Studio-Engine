import { api } from "./client";
import { Review } from "@/types";

export async function listReviews(page = 1) {
  const { data } = await api.get<{
    success: boolean;
    reviews: Review[];
    avgRating: number;
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/api/reviews", { params: { page } });
  return data;
}
