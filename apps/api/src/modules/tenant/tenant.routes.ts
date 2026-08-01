import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { getPublicTenantBySlug, updateTenant } from "./tenant.controller";

export const tenantRouter = Router();

tenantRouter.get("/public/:slug", getPublicTenantBySlug);
tenantRouter.patch("/me", requireAuth, updateTenant);
