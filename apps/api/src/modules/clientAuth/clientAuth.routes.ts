import { Router } from "express";
import { requestClientOtp, verifyClientOtpAndAuth, getClientMe, updateClientMe } from "./clientAuth.controller";
import { requireClientAuth } from "@/middlewares/requireClientAuth";

export const clientAuthRouter = Router();

clientAuthRouter.post("/otp/request", requestClientOtp);
clientAuthRouter.post("/otp/verify", verifyClientOtpAndAuth);
clientAuthRouter.get("/me", requireClientAuth, getClientMe);
clientAuthRouter.patch("/me", requireClientAuth, updateClientMe);
