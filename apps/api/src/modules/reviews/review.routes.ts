import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { createVerifiedReview, listOwnerReviews, listPublicReviews } from "./review.controller";

export const reviewRouter = Router();

reviewRouter.get("/public/:slug", listPublicReviews);
reviewRouter.post("/public/:slug", createVerifiedReview);
reviewRouter.get("/", requireAuth, listOwnerReviews);
