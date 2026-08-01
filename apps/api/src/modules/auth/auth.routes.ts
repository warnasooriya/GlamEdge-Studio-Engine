import { Router } from "express";
import { requestOtp, verifyOtpAndAuth, getMe } from "./auth.controller";
import { requireAuth } from "@/middlewares/requireAuth";

export const authRouter = Router();

authRouter.post("/otp/request", requestOtp);
authRouter.post("/otp/verify", verifyOtpAndAuth);
authRouter.get("/me", requireAuth, getMe);
