import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/utils/jwt";
import { verifyClientToken } from "@/utils/clientJwt";

export type AppointmentParty = { type: "OWNER"; tenantId: string } | { type: "CLIENT"; clientId: string };

export interface AppointmentPartyRequest extends Request {
  party?: AppointmentParty;
}

export const requireAppointmentParty = (req: AppointmentPartyRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyToken(token);
    req.party = { type: "OWNER", tenantId: payload.tenantId };
    return next();
  } catch {
    // Not an owner token — try client.
  }

  try {
    const payload = verifyClientToken(token);
    req.party = { type: "CLIENT", clientId: payload.clientId };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
