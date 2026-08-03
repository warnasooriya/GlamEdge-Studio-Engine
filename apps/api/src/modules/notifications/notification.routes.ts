import { Router } from "express";
import { requireClientAuth } from "@/middlewares/requireClientAuth";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "./notification.controller";

export const notificationRouter = Router();

notificationRouter.use(requireClientAuth);
notificationRouter.get("/", listNotifications);
notificationRouter.patch("/:id/read", markNotificationRead);
notificationRouter.post("/read-all", markAllNotificationsRead);
