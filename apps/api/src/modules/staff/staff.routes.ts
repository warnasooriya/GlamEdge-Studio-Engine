import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  staffCommissionSummary,
} from "./staff.controller";

export const staffRouter = Router();

staffRouter.use(requireAuth);
staffRouter.get("/", listStaff);
staffRouter.post("/", createStaff);
staffRouter.patch("/:id", updateStaff);
staffRouter.delete("/:id", deleteStaff);
staffRouter.get("/:id/commission", staffCommissionSummary);
