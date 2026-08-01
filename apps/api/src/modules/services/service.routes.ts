import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  listServices,
  createService,
  updateService,
  deleteService,
  listServiceTemplates,
} from "./service.controller";

export const serviceRouter = Router();

serviceRouter.use(requireAuth);
serviceRouter.get("/templates", listServiceTemplates);
serviceRouter.get("/", listServices);
serviceRouter.post("/", createService);
serviceRouter.patch("/:id", updateService);
serviceRouter.delete("/:id", deleteService);
