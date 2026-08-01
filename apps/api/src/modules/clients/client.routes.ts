import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { listClients, getClientDetail } from "./client.controller";

export const clientRouter = Router();

clientRouter.use(requireAuth);
clientRouter.get("/", listClients);
clientRouter.get("/:id", getClientDetail);
