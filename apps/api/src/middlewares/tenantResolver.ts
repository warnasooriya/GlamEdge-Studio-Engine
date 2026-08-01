import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/prisma";

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

const RESERVED_SUBDOMAINS = new Set(["www", "glamedge", "localhost", "api"]);

export const tenantResolver = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  const host = req.headers.host || "";
  const subdomain = host.split(".")[0];
  const headerTenantId = req.headers["x-tenant-id"] as string | undefined;
  const querySlug = req.query.tenant as string | undefined;

  try {
    let tenant = null;

    if (headerTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: headerTenantId } });
    } else if (querySlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: querySlug } });
    } else if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      tenant = await prisma.tenant.findUnique({ where: { slug: subdomain } });
    }

    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ error: "Salon Workspace Not Found or Inactive" });
    }

    req.tenantId = tenant.id;
    req.tenantSlug = tenant.slug;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Multi-Tenant Resolution Error" });
  }
};
