import { Request, Response, NextFunction } from "express";
import { verifyAdminToken, AdminJwtPayload } from "@/utils/adminJwt";

export interface AdminAuthRequest extends Request {
  adminId?: string;
  adminAuth?: AdminJwtPayload;
}

export const requireAdminAuth = (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyAdminToken(token);
    req.adminAuth = payload;
    req.adminId = payload.adminId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
