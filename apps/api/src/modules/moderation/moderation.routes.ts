import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  createReport,
  listReports,
  listBlockedClients,
  blockClient,
  unblockClient,
} from "./moderation.controller";

export const moderationRouter = Router();

moderationRouter.post("/reports", requireAuth, createReport);
moderationRouter.get("/reports", requireAuth, listReports);
moderationRouter.get("/blocks", requireAuth, listBlockedClients);
moderationRouter.post("/blocks", requireAuth, blockClient);
moderationRouter.delete("/blocks/:clientId", requireAuth, unblockClient);
