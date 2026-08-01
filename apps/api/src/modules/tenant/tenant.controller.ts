import { Response, Request } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { AuthRequest } from "@/middlewares/requireAuth";

const updateTenantSchema = z.object({
  salonName: z.string().min(2).max(191).optional(),
  ownerName: z.string().min(2).max(191).optional(),
});

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
