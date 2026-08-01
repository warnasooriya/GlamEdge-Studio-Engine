import { Router } from "express";
import { createVerifiedReview, listPublicReviews } from "./review.controller";

export const reviewRouter = Router();

reviewRouter.get("/public/:slug", listPublicReviews);
reviewRouter.post("/public/:slug", createVerifiedReview);
