import { Router } from "express";
import { requireAdminAuth } from "@/middlewares/requireAdminAuth";
import {
  adminLogin,
  getAdminMe,
  listTenants,
  approveTenant,
  rejectTenant,
  suspendTenant,
  reactivateTenant,
  updateTenantSubscription,
  getAdminStats,
  recordPayment,
  listTenantPayments,
  listAllPayments,
} from "./admin.controller";
import { getWhatsAppQr, getWhatsAppStatus } from "./adminWhatsApp.controller";

export const adminRouter = Router();

adminRouter.post("/login", adminLogin);

adminRouter.use(requireAdminAuth);
adminRouter.get("/me", getAdminMe);
adminRouter.get("/stats", getAdminStats);
adminRouter.get("/tenants", listTenants);
adminRouter.post("/tenants/:id/approve", approveTenant);
adminRouter.post("/tenants/:id/reject", rejectTenant);
adminRouter.post("/tenants/:id/suspend", suspendTenant);
adminRouter.post("/tenants/:id/reactivate", reactivateTenant);
adminRouter.patch("/tenants/:id/subscription", updateTenantSubscription);
adminRouter.get("/tenants/:id/payments", listTenantPayments);
adminRouter.post("/tenants/:id/payments", recordPayment);
adminRouter.get("/payments", listAllPayments);
adminRouter.get("/whatsapp/status", getWhatsAppStatus);
adminRouter.get("/whatsapp/qr", getWhatsAppQr);
