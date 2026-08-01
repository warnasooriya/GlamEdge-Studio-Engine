import { Response, Request } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { AuthRequest } from "@/middlewares/requireAuth";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { storageProvider } from "@/services/storage";

const updateTenantSchema = z.object({
  salonName: z.string().min(2).max(191).optional(),
  ownerName: z.string().min(2).max(191).optional(),
  address: z.string().max(2000).optional(),
  mapLink: z.string().max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  contactPhone: z.string().max(50).optional(),
});

export async function listPublicTenants(req: Request, res: Response) {
  const { page, pageSize, skip, take } = parsePagination(req.query, 12, 50);
  const where = { isActive: true };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      select: {
        id: true,
        salonName: true,
        slug: true,
        services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { salonName: "asc" },
      skip,
      take,
    }),
    prisma.tenant.count({ where }),
  ]);

  return res.json({ success: true, tenants, ...paginationMeta(total, page, pageSize) });
}

export async function getPublicTenantBySlug(req: Request, res: Response) {
  const { slug } = req.params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      salonName: true,
      slug: true,
      subscription: true,
      isActive: true,
      logoUrl: true,
      address: true,
      mapLink: true,
      latitude: true,
      longitude: true,
      contactPhone: true,
      services: { where: { isActive: true } },
      staff: { where: { isActive: true }, select: { id: true, name: true, role: true } },
    },
  });
  if (!tenant || !tenant.isActive) throw new HttpError(404, "Salon not found");
  return res.json({ success: true, tenant });
}

export async function updateTenant(req: AuthRequest, res: Response) {
  const data = updateTenantSchema.parse(req.body);
  const tenant = await prisma.tenant.update({ where: { id: req.tenantId! }, data });
  return res.json({ success: true, tenant });
}

export async function uploadTenantLogo(req: AuthRequest, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) throw new HttpError(400, "Logo image is required");

  const ext = file.mimetype.split("/")[1];
  const key = `tenants/${req.tenantId}/logo-${uuid()}.${ext}`;
  const logoUrl = await storageProvider.upload(key, file.buffer, file.mimetype);

  const tenant = await prisma.tenant.update({
    where: { id: req.tenantId! },
    data: { logoUrl },
  });

  return res.json({ success: true, tenant });
}
