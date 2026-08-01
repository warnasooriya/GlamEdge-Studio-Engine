import { Request, Response, NextFunction } from "express";
import { verifyClientToken, ClientJwtPayload } from "@/utils/clientJwt";

export interface ClientAuthRequest extends Request {
  clientId?: string;
  clientAuth?: ClientJwtPayload;
}

export const requireClientAuth = (req: ClientAuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyClientToken(token);
    req.clientAuth = payload;
    req.clientId = payload.clientId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
