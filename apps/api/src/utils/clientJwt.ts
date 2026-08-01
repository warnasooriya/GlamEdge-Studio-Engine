import jwt from "jsonwebtoken";
import { env } from "@/config/env";

const CLIENT_JWT_SECRET = `${env.jwtSecret}:client`;

export interface ClientJwtPayload {
  clientId: string;
  phone: string;
  role: "client";
}

export function signClientToken(payload: ClientJwtPayload): string {
  return jwt.sign(payload, CLIENT_JWT_SECRET, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyClientToken(token: string): ClientJwtPayload {
  return jwt.verify(token, CLIENT_JWT_SECRET) as ClientJwtPayload;
}
