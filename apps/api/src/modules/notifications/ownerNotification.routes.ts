import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  listOwnerNotifications,
  markOwnerNotificationRead,
  markAllOwnerNotificationsRead,
} from "./ownerNotification.controller";

export const ownerNotificationRouter = Router();

ownerNotificationRouter.use(requireAuth);
ownerNotificationRouter.get("/", listOwnerNotifications);
ownerNotificationRouter.patch("/:id/read", markOwnerNotificationRead);
ownerNotificationRouter.post("/read-all", markAllOwnerNotificationsRead);
