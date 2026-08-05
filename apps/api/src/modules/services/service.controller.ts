import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { createServiceSchema, updateServiceSchema } from "./service.schema";

export async function listServices(req: AuthRequest, res: Response) {
  const services = await prisma.service.findMany({
    where: { tenantId: req.tenantId!, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return res.json({ success: true, services });
}

export async function createService(req: AuthRequest, res: Response) {
  const data = createServiceSchema.parse(req.body);
  const service = await prisma.service.create({
    data: { ...data, tenantId: req.tenantId! },
  });
  return res.status(201).json({ success: true, service });
}

export async function updateService(req: AuthRequest, res: Response) {
  const data = updateServiceSchema.parse(req.body);
  const existing = await prisma.service.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!existing) throw new HttpError(404, "Service not found");

  const service = await prisma.service.update({ where: { id: existing.id }, data });
  return res.json({ success: true, service });
}

export async function deleteService(req: AuthRequest, res: Response) {
  const existing = await prisma.service.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!existing) throw new HttpError(404, "Service not found");

  await prisma.service.update({ where: { id: existing.id }, data: { isActive: false } });
  return res.json({ success: true });
}

// Default template presets an owner can enable in one tap during onboarding.
export const SERVICE_TEMPLATES = [
  { category: "LADIES", name: "Bridal Dressing", price: 25000, durationMin: 180 },
  { category: "LADIES", name: "Saree Draping", price: 3000, durationMin: 45 },
  { category: "LADIES", name: "Hair Coloring", price: 6000, durationMin: 90 },
  { category: "LADIES", name: "Facial", price: 3500, durationMin: 60 },
  { category: "LADIES", name: "Nail Art", price: 2500, durationMin: 45 },
  { category: "GENTS", name: "Haircut", price: 1500, durationMin: 30 },
  { category: "GENTS", name: "Beard Sculpting", price: 1000, durationMin: 20 },
  { category: "GENTS", name: "Hair Treatment", price: 4000, durationMin: 60 },
  { category: "GENTS", name: "Groom Package", price: 12000, durationMin: 150 },
  { category: "KIDS", name: "Kids Haircut", price: 1000, durationMin: 25 },
  { category: "KIDS", name: "First Haircut Ceremony", price: 3000, durationMin: 45 },
] as const;

export async function listServiceTemplates(req: AuthRequest, res: Response) {
  const { search, category } = req.query as { search?: string; category?: string };
  const { page, pageSize, skip, take } = parsePagination(req.query, 8, 50);

  const q = search?.trim().toLowerCase();
  const filtered = SERVICE_TEMPLATES.filter((t) => {
    if (category && category !== "ALL" && t.category !== category) return false;
    if (q && !t.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const templates = filtered.slice(skip, skip + take);
  return res.json({ success: true, templates, ...paginationMeta(filtered.length, page, pageSize) });
}
