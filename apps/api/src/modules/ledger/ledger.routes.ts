import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { listLedgerEntries, createLedgerEntry, endOfDayReconciliation } from "./ledger.controller";

export const ledgerRouter = Router();

ledgerRouter.use(requireAuth);
ledgerRouter.get("/", listLedgerEntries);
ledgerRouter.post("/", createLedgerEntry);
ledgerRouter.get("/reconciliation", endOfDayReconciliation);
