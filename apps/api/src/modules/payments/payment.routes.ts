import { Router } from "express";
import { capturePaypalOrder, createPaypalOrder, getPaypalPaymentInfo } from "./payment.controller";

export const paymentRouter = Router();

paymentRouter.get("/paypal/:id", getPaypalPaymentInfo);
paymentRouter.post("/paypal/:id/create-order", createPaypalOrder);
paymentRouter.post("/paypal/:id/capture-order", capturePaypalOrder);
