import { Response, NextFunction } from "express";
import { verifyToken } from "@/utils/jwt";
import { prisma } from "@/config/prisma";
import { TenantRequest } from "./tenantResolver";

export interface AuthRequest extends TenantRequest {
  auth?: { tenantId: string; phone: string };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyToken(token);

    // Re-check live status on every request — a suspended/rejected salon's existing
    // token must stop working immediately, not just block future logins.
    const tenant = await prisma.tenant.findUnique({ where: { id: payload.tenantId }, select: { status: true } });
    if (!tenant || tenant.status !== "APPROVED") {
      return res.status(403).json({ error: "This account no longer has dashboard access." });
    }

    req.auth = payload;
    req.tenantId = payload.tenantId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
