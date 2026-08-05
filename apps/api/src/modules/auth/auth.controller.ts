import { Response } from "express";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { otpProvider } from "@/services/otp";
import { issueOtp, verifyOtp, consumeOtp } from "@/services/otp/otpStore";
import { generateUniqueSlug } from "@/utils/slug";
import { signToken } from "@/utils/jwt";
import { requestOtpSchema, verifyOtpSchema } from "./auth.schema";
import { AuthRequest } from "@/middlewares/requireAuth";
import { Request } from "express";
import { storageProvider } from "@/services/storage";

export async function requestOtp(req: Request, res: Response) {
  const { phone } = requestOtpSchema.parse(req.body);
  const code = await issueOtp(phone);
  await otpProvider.send(phone, code);
  return res.json({ success: true, message: "OTP sent" });
}

export async function verifyOtpAndAuth(req: Request, res: Response) {
  const { phone, code, salonName, ownerName } = verifyOtpSchema.parse(req.body);

  const isValid = await verifyOtp(phone, code);
  if (!isValid) {
    throw new HttpError(400, "Invalid or expired OTP code");
  }

  let tenant = await prisma.tenant.findUnique({ where: { phone } });

  if (!tenant) {
    if (!salonName || !ownerName) {
      throw new HttpError(400, "salonName and ownerName are required to register a new salon");
    }
    const slug = await generateUniqueSlug(salonName);
    // New salons start PENDING — no dashboard access until an administrator approves them.
    tenant = await prisma.tenant.create({
      data: { phone, salonName, ownerName, slug },
    });
  }

  await consumeOtp(phone);

  if (tenant.status === "REJECTED") {
    throw new HttpError(
      403,
      tenant.rejectionReason
        ? `Your salon registration was not approved: ${tenant.rejectionReason}`
        : "Your salon registration was not approved. Contact support for details."
    );
  }
  if (tenant.status === "SUSPENDED") {
    throw new HttpError(403, "Your account has been suspended. Contact support for details.");
  }
  if (tenant.status === "PENDING") {
    return res.status(200).json({
      success: true,
      pendingApproval: true,
      message: "Your salon registration is pending admin approval. We'll notify you once it's reviewed.",
    });
  }

  if (tenant.logoUrl) tenant.logoUrl = await storageProvider.resolveUrl(tenant.logoUrl);
  const token = signToken({ tenantId: tenant.id, phone: tenant.phone });
  return res.status(200).json({ success: true, token, tenant });
}

export async function getMe(req: AuthRequest, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.auth!.tenantId } });
  if (!tenant) throw new HttpError(404, "Tenant not found");
  if (tenant.logoUrl) tenant.logoUrl = await storageProvider.resolveUrl(tenant.logoUrl);
  return res.json({ success: true, tenant });
}
