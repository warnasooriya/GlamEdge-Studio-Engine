import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { requireClientAuth } from "@/middlewares/requireClientAuth";
import { requireAppointmentParty } from "@/middlewares/requireAppointmentParty";
import {
  listAppointments,
  getAppointmentById,
  createPublicAppointment,
  getAvailability,
  updateAppointmentStatus,
  listMyAppointments,
  getMyAppointmentById,
  proposeReschedule,
  respondToReschedule,
  listPendingReviewAppointments,
  submitAppointmentReview,
  createWalkInAppointment,
} from "./appointment.controller";
import { listMessages, sendMessage } from "./message.controller";
import { uploadMessageAttachment } from "./message.upload";

export const appointmentRouter = Router();

appointmentRouter.get("/public/:slug/availability", getAvailability);
appointmentRouter.post("/public/:slug", requireClientAuth, createPublicAppointment);
appointmentRouter.get("/me", requireClientAuth, listMyAppointments);
appointmentRouter.get("/me/pending-reviews", requireClientAuth, listPendingReviewAppointments);
appointmentRouter.get("/me/:id", requireClientAuth, getMyAppointmentById);
appointmentRouter.post("/:id/reschedule/respond", requireClientAuth, respondToReschedule);
appointmentRouter.post("/:id/review", requireClientAuth, submitAppointmentReview);

appointmentRouter.get("/:id/messages", requireAppointmentParty, listMessages);
appointmentRouter.post(
  "/:id/messages",
  requireAppointmentParty,
  uploadMessageAttachment.single("attachment"),
  sendMessage
);

appointmentRouter.use(requireAuth);
appointmentRouter.get("/", listAppointments);
appointmentRouter.post("/walk-in", createWalkInAppointment);
appointmentRouter.get("/:id", getAppointmentById);
appointmentRouter.patch("/:id/status", updateAppointmentStatus);
appointmentRouter.patch("/:id/reschedule", proposeReschedule);
