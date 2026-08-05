import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { getAnalyticsOverview } from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get("/overview", getAnalyticsOverview);
