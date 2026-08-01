import { Response, NextFunction } from "express";
import { verifyToken } from "@/utils/jwt";
import { TenantRequest } from "./tenantResolver";

export interface AuthRequest extends TenantRequest {
  auth?: { tenantId: string; phone: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyToken(token);
    req.auth = payload;
    req.tenantId = payload.tenantId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
