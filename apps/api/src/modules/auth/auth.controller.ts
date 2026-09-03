import { Response } from "express";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { otpProvider } from "@/services/otp";
import { issueOtp, verifyOtp, consumeOtp, isDemoPhone } from "@/services/otp/otpStore";
import { generateUniqueSlug } from "@/utils/slug";
import { signToken } from "@/utils/jwt";
import { requestOtpSchema, verifyOtpSchema } from "./auth.schema";
import { AuthRequest } from "@/middlewares/requireAuth";
import { Request } from "express";
import { storageProvider } from "@/services/storage";

export async function requestOtp(req: Request, res: Response) {
  const { phone } = requestOtpSchema.parse(req.body);
  // The store-review number verifies against a fixed code, so there is nothing to
  // send. Falling through would also overwrite that code with a random one and
  // spend SMS credit on a number nobody reads.
  if (!isDemoPhone(phone)) {
    const code = await issueOtp(phone);
    await otpProvider.send(phone, code);
  }
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

// App Store Guideline 5.1.1(v): an app that creates accounts must let the owner
// delete theirs from inside the app. This is a scrub-and-revoke rather than a row
// delete — Ledger and SubscriptionPayment are financial records the business is
// required to keep, and cascading the tenant away would take them with it.
export async function deleteAccount(req: AuthRequest, res: Response) {
  const { tenantId } = req.auth!;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new HttpError(404, "Tenant not found");

  // phone and slug are unique columns, so they have to be vacated rather than
  // nulled — otherwise this salon's old number could never register again, and
  // the public profile URL would stay reserved forever.
  const tombstone = `deleted-${tenant.id}`;

  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        isActive: false,
        phone: tombstone,
        slug: tombstone,
        salonName: "Deleted salon",
        ownerName: "Deleted",
        logoUrl: null,
        address: null,
        mapLink: null,
        latitude: null,
        longitude: null,
        contactPhone: null,
        paypalEmail: null,
      },
    }),
    // Staff phone numbers belong to employees, not the business, so they go with
    // the account. Names stay — commission rows in Reports reference them.
    prisma.staff.updateMany({ where: { tenantId }, data: { phone: null, isActive: false } }),
    // Stop every future push to this salon's devices.
    prisma.ownerPushToken.deleteMany({ where: { tenantId } }),
    prisma.ownerNotification.deleteMany({ where: { tenantId } }),
  ]);

  // NOTE: Client rows are deliberately untouched. clients.phone is globally
  // unique and a client is shared across every salon they have ever booked with,
  // so scrubbing one here would corrupt other tenants' customer histories.

  // requireAuth re-reads status on every request and only lets APPROVED through,
  // so the owner's existing token is dead the moment this commits.
  return res.json({ success: true, message: "Your account has been deleted." });
}
