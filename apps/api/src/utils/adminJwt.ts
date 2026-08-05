import jwt from "jsonwebtoken";
import { env } from "@/config/env";

const ADMIN_JWT_SECRET = `${env.jwtSecret}:admin`;

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: "admin";
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  return jwt.verify(token, ADMIN_JWT_SECRET) as AdminJwtPayload;
}
