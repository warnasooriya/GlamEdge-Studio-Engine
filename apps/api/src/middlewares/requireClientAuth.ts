import { Request, Response, NextFunction } from "express";
import { verifyClientToken, ClientJwtPayload } from "@/utils/clientJwt";
import { prisma } from "@/config/prisma";

export interface ClientAuthRequest extends Request {
  clientId?: string;
  clientAuth?: ClientJwtPayload;
}

export const requireClientAuth = async (req: ClientAuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyClientToken(token);

    // Re-check the client row still exists on every request — a stale token
    // pointing at a deleted/missing client previously slipped through and hit
    // a raw FK-constraint 500 in createPublicAppointment instead of a clean
    // re-login. Mirrors the same live re-check requireAuth does for tenants.
    const client = await prisma.client.findUnique({ where: { id: payload.clientId }, select: { id: true } });
    if (!client) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.clientAuth = payload;
    req.clientId = payload.clientId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
