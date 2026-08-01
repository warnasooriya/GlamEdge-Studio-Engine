import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { requireClientAuth } from "@/middlewares/requireClientAuth";
import {
  listAppointments,
  createPublicAppointment,
  getAvailability,
  updateAppointmentStatus,
} from "./appointment.controller";

export const appointmentRouter = Router();

appointmentRouter.get("/public/:slug/availability", getAvailability);
appointmentRouter.post("/public/:slug", requireClientAuth, createPublicAppointment);

appointmentRouter.use(requireAuth);
appointmentRouter.get("/", listAppointments);
appointmentRouter.patch("/:id/status", updateAppointmentStatus);
