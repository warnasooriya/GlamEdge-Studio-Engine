import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { uploadLogo } from "./tenant.upload";
import { getPublicTenantBySlug, listPublicTenants, updateTenant, uploadTenantLogo } from "./tenant.controller";

export const tenantRouter = Router();

tenantRouter.get("/public", listPublicTenants);
tenantRouter.get("/public/:slug", getPublicTenantBySlug);
tenantRouter.patch("/me", requireAuth, updateTenant);
tenantRouter.post("/me/logo", requireAuth, uploadLogo.single("logo"), uploadTenantLogo);
