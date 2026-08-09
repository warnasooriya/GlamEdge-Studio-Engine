import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { cancelPaypalLink, createInvoice, listInvoices } from "./billing.controller";

export const billingRouter = Router();

billingRouter.use(requireAuth);
billingRouter.get("/", listInvoices);
billingRouter.post("/appointments/:appointmentId/invoice", createInvoice);
billingRouter.post("/appointments/:appointmentId/paypal-link/cancel", cancelPaypalLink);
