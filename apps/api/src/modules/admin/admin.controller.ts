import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import { Prisma, SubscriptionCycle, SubscriptionTier, TenantStatus } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { AdminAuthRequest } from "@/middlewares/requireAdminAuth";
import { signAdminToken } from "@/utils/adminJwt";
import { sendWhatsAppText } from "@/services/whatsapp/whatsappService";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import {
  adminLoginSchema,
  rejectTenantSchema,
  updateSubscriptionSchema,
  recordPaymentSchema,
} from "./admin.schema";

function addCycle(from: Date, cycle: SubscriptionCycle): Date {
  const next = new Date(from);
  if (cycle === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

// List price per plan in LKR. Used as the starting fee when a salon is approved or
// switches plan; an admin can always override it per salon.
const PLAN_PRICING: Record<SubscriptionTier, Record<SubscriptionCycle, number>> = {
  STARTER: { MONTHLY: 2500, YEARLY: 25000 },
  PRO: { MONTHLY: 5000, YEARLY: 50000 },
  ENTERPRISE: { MONTHLY: 12000, YEARLY: 120000 },
};

function defaultFee(tier: SubscriptionTier, cycle: SubscriptionCycle): number {
  return PLAN_PRICING[tier][cycle];
}

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = adminLoginSchema.parse(req.body);

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) throw new HttpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password");

  const token = signAdminToken({ adminId: admin.id, email: admin.email, role: "admin" });
  return res.json({ success: true, token, admin: { id: admin.id, email: admin.email, name: admin.name } });
}

export async function getAdminMe(req: AdminAuthRequest, res: Response) {
  const admin = await prisma.admin.findUnique({ where: { id: req.adminId! } });
  if (!admin) throw new HttpError(404, "Admin not found");
  return res.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } });
}

export async function listTenants(req: AdminAuthRequest, res: Response) {
  const { status, search, expiringSoon } = req.query as { status?: string; search?: string; expiringSoon?: string };
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);

  const where: Prisma.TenantWhereInput = {};
  if (status && status !== "ALL") where.status = status as TenantStatus;
  if (search) {
    where.OR = [
      { salonName: { contains: search } },
      { ownerName: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (expiringSoon === "true") {
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    where.status = "APPROVED";
    where.subscriptionExpiresAt = { lte: in7Days };
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.tenant.count({ where }),
  ]);

  return res.json({ success: true, tenants, ...paginationMeta(total, page, pageSize) });
}

export async function approveTenant(req: AdminAuthRequest, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new HttpError(404, "Salon not found");
  if (tenant.status === "APPROVED") throw new HttpError(400, "Salon is already approved");

  const now = new Date();
  const subscriptionStartedAt = tenant.subscriptionStartedAt ?? now;
  const subscriptionExpiresAt = tenant.subscriptionExpiresAt ?? addCycle(now, tenant.subscriptionCycle);

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      status: "APPROVED",
      approvedAt: now,
      rejectionReason: null,
      subscriptionStartedAt,
      subscriptionExpiresAt,
      // Seed the list price for the plan unless an admin already set a custom fee.
      ...(Number(tenant.subscriptionFee) === 0
        ? { subscriptionFee: defaultFee(tenant.subscription, tenant.subscriptionCycle) }
        : {}),
    },
  });

  try {
    await sendWhatsAppText(
      tenant.phone,
      `Great news! ${tenant.salonName} has been approved on GlamEdge Studio Engine. You can now log in and start managing your salon.`
    );
  } catch (err) {
    console.error("WhatsApp approval notice failed:", err);
  }

  return res.json({ success: true, tenant: updated });
}

export async function rejectTenant(req: AdminAuthRequest, res: Response) {
  const { reason } = rejectTenantSchema.parse(req.body);
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new HttpError(404, "Salon not found");

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { status: "REJECTED", rejectionReason: reason || null },
  });

  try {
    await sendWhatsAppText(
      tenant.phone,
      `Your registration for ${tenant.salonName} on GlamEdge Studio Engine was not approved.${reason ? ` Reason: ${reason}` : ""} Contact support if you have questions.`
    );
  } catch (err) {
    console.error("WhatsApp rejection notice failed:", err);
  }

  return res.json({ success: true, tenant: updated });
}

export async function suspendTenant(req: AdminAuthRequest, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new HttpError(404, "Salon not found");

  const updated = await prisma.tenant.update({ where: { id: tenant.id }, data: { status: "SUSPENDED" } });

  try {
    await sendWhatsAppText(
      tenant.phone,
      `Your GlamEdge Studio Engine account for ${tenant.salonName} has been suspended. Contact support for details.`
    );
  } catch (err) {
    console.error("WhatsApp suspension notice failed:", err);
  }

  return res.json({ success: true, tenant: updated });
}

export async function reactivateTenant(req: AdminAuthRequest, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new HttpError(404, "Salon not found");

  const updated = await prisma.tenant.update({ where: { id: tenant.id }, data: { status: "APPROVED" } });

  try {
    await sendWhatsAppText(
      tenant.phone,
      `Your GlamEdge Studio Engine account for ${tenant.salonName} has been reactivated. You can log in again.`
    );
  } catch (err) {
    console.error("WhatsApp reactivation notice failed:", err);
  }

  return res.json({ success: true, tenant: updated });
}

export async function updateTenantSubscription(req: AdminAuthRequest, res: Response) {
  const data = updateSubscriptionSchema.parse(req.body);
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new HttpError(404, "Salon not found");

  const cycle = data.subscriptionCycle ?? tenant.subscriptionCycle;
  const tier = data.subscription ?? tenant.subscription;
  let subscriptionExpiresAt = data.subscriptionExpiresAt ?? tenant.subscriptionExpiresAt ?? undefined;

  if (data.renew) {
    const base = tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt > new Date() ? tenant.subscriptionExpiresAt : new Date();
    subscriptionExpiresAt = addCycle(base, cycle);
  }

  // An explicit fee always wins. Otherwise, changing plan or cycle re-prices the
  // salon to that plan's list price rather than silently keeping the old amount.
  const planChanged = tier !== tenant.subscription || cycle !== tenant.subscriptionCycle;
  const subscriptionFee =
    data.subscriptionFee ?? (planChanged ? defaultFee(tier, cycle) : undefined);

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscription: tier,
      subscriptionCycle: cycle,
      subscriptionFee,
      subscriptionExpiresAt,
      subscriptionStartedAt: tenant.subscriptionStartedAt ?? new Date(),
      expiryNotifiedAt: data.renew ? null : undefined,
    },
  });

  return res.json({ success: true, tenant: updated });
}

export async function recordPayment(req: AdminAuthRequest, res: Response) {
  const data = recordPaymentSchema.parse(req.body);
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new HttpError(404, "Salon not found");

  const paidAt = data.paidAt ?? new Date();

  // The payment covers the cycle starting wherever the current subscription ends
  // (or today, if it already lapsed) — the same base the renewal uses.
  const periodStart =
    tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt > paidAt
      ? tenant.subscriptionExpiresAt
      : paidAt;
  const periodEnd = addCycle(periodStart, tenant.subscriptionCycle);

  const payment = await prisma.subscriptionPayment.create({
    data: {
      tenantId: tenant.id,
      amount: data.amount,
      tier: tenant.subscription,
      cycle: tenant.subscriptionCycle,
      paymentMode: data.paymentMode,
      reference: data.reference || null,
      notes: data.notes || null,
      periodStart,
      periodEnd,
      paidAt,
      recordedById: req.adminId!,
    },
  });

  let updatedTenant = tenant;
  if (data.extendSubscription) {
    updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionExpiresAt: periodEnd,
        subscriptionStartedAt: tenant.subscriptionStartedAt ?? paidAt,
        expiryNotifiedAt: null,
      },
    });
  }

  try {
    await sendWhatsAppText(
      tenant.phone,
      `Payment received: LKR ${data.amount.toFixed(2)} for your ${tenant.subscription} plan.${
        data.extendSubscription ? ` Your subscription is now active until ${periodEnd.toLocaleDateString("en-LK")}.` : ""
      }`
    );
  } catch (err) {
    console.error("WhatsApp payment receipt failed:", err);
  }

  return res.status(201).json({ success: true, payment, tenant: updatedTenant });
}

export async function listTenantPayments(req: AdminAuthRequest, res: Response) {
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);
  const tenantId = req.params.id;

  const [payments, total, sum] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      where: { tenantId },
      orderBy: { paidAt: "desc" },
      skip,
      take,
      include: { recordedBy: { select: { id: true, name: true } } },
    }),
    prisma.subscriptionPayment.count({ where: { tenantId } }),
    prisma.subscriptionPayment.aggregate({ where: { tenantId }, _sum: { amount: true } }),
  ]);

  return res.json({
    success: true,
    payments,
    totalPaid: sum._sum.amount ?? 0,
    ...paginationMeta(total, page, pageSize),
  });
}

export async function listAllPayments(req: AdminAuthRequest, res: Response) {
  const { search, from, to } = req.query as { search?: string; from?: string; to?: string };
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);

  const where: Prisma.SubscriptionPaymentWhereInput = {};
  if (search) {
    where.tenant = {
      OR: [{ salonName: { contains: search } }, { ownerName: { contains: search } }, { phone: { contains: search } }],
    };
  }
  if (from || to) {
    where.paidAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [payments, total, sum, monthSum] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip,
      take,
      include: {
        tenant: { select: { id: true, salonName: true, phone: true, ownerName: true } },
        recordedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.subscriptionPayment.count({ where }),
    prisma.subscriptionPayment.aggregate({ where, _sum: { amount: true } }),
    prisma.subscriptionPayment.aggregate({
      where: { paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return res.json({
    success: true,
    payments,
    summary: {
      totalCollected: sum._sum.amount ?? 0,
      matchingCount: total,
      thisMonthCollected: monthSum._sum.amount ?? 0,
      thisMonthCount: monthSum._count,
    },
    ...paginationMeta(total, page, pageSize),
  });
}

export async function getAdminStats(req: AdminAuthRequest, res: Response) {
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const now = new Date();

  const [total, pending, approved, rejected, suspended, expiringSoon, expired] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "PENDING" } }),
    prisma.tenant.count({ where: { status: "APPROVED" } }),
    prisma.tenant.count({ where: { status: "REJECTED" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
    prisma.tenant.count({ where: { status: "APPROVED", subscriptionExpiresAt: { gte: now, lte: in7Days } } }),
    prisma.tenant.count({ where: { status: "APPROVED", subscriptionExpiresAt: { lt: now } } }),
  ]);

  return res.json({ success: true, stats: { total, pending, approved, rejected, suspended, expiringSoon, expired } });
}
