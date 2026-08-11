import { Response } from "express";
import { PushPlatform } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";

const PLATFORMS = new Set<PushPlatform>(["IOS", "ANDROID"]);

export async function registerPushToken(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const { token, platform } = req.body as { token?: string; platform?: string };

  if (!token) throw new HttpError(400, "token is required");
  if (!platform || !PLATFORMS.has(platform as PushPlatform)) {
    throw new HttpError(400, "platform must be IOS or ANDROID");
  }

  // A token can move between tenants (owner logs out, a different owner logs
  // into the same device) — upsert-by-token reassigns it rather than erroring.
  const pushToken = await prisma.ownerPushToken.upsert({
    where: { token },
    create: { tenantId, token, platform: platform as PushPlatform },
    update: { tenantId, platform: platform as PushPlatform },
  });

  return res.json({ success: true, pushToken });
}

export async function unregisterPushToken(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const { token } = req.body as { token?: string };
  if (!token) throw new HttpError(400, "token is required");

  await prisma.ownerPushToken.deleteMany({ where: { token, tenantId } });
  return res.json({ success: true });
}
