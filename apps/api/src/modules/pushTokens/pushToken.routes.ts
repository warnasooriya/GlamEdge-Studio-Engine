import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { registerPushToken, unregisterPushToken } from "./pushToken.controller";

export const pushTokenRouter = Router();

pushTokenRouter.use(requireAuth);
pushTokenRouter.post("/", registerPushToken);
pushTokenRouter.delete("/", unregisterPushToken);
