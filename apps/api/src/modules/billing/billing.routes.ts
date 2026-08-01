import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { createInvoice } from "./billing.controller";

export const billingRouter = Router();

billingRouter.use(requireAuth);
billingRouter.post("/appointments/:appointmentId/invoice", createInvoice);
