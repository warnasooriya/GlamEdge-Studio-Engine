import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  getRevenueReport,
  getCancellationReport,
  getMissedAppointmentsReport,
  getStaffCommissionSummary,
  getStaffCommissionDetail,
} from "./reports.controller";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);
reportsRouter.get("/revenue", getRevenueReport);
reportsRouter.get("/cancellations", getCancellationReport);
reportsRouter.get("/missed-appointments", getMissedAppointmentsReport);
reportsRouter.get("/staff-commission", getStaffCommissionSummary);
reportsRouter.get("/staff-commission/:staffId", getStaffCommissionDetail);
