import { Response } from "express";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { AuthRequest } from "@/middlewares/requireAuth";
import { createReportSchema, blockClientSchema } from "./moderation.schema";

// App Store Guideline 1.2: an app carrying user-generated content must let people
// report it and block the person who posted it. The salon owner sees content
// written by their own clients — reviews, chat messages — so both live here.

export async function createReport(req: AuthRequest, res: Response) {
  const { tenantId } = req.auth!;
  const input = createReportSchema.parse(req.body);

  // One open report per target per salon: tapping Report twice on the same
  // message shouldn't queue the same complaint again.
  const existing = await prisma.contentReport.findFirst({
    where: { tenantId, targetType: input.targetType, targetId: input.targetId, status: "OPEN" },
  });
  if (existing) {
    return res.status(200).json({ success: true, report: existing, alreadyReported: true });
  }

  const report = await prisma.contentReport.create({
    data: {
      tenantId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: input.details,
    },
  });

  return res.status(201).json({ success: true, report });
}

export async function listReports(req: AuthRequest, res: Response) {
  const { tenantId } = req.auth!;
  const reports = await prisma.contentReport.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return res.json({ success: true, reports });
}

export async function listBlockedClients(req: AuthRequest, res: Response) {
  const { tenantId } = req.auth!;
  const blocks = await prisma.blockedClient.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true, phone: true } } },
  });
  return res.json({ success: true, blocks });
}

export async function blockClient(req: AuthRequest, res: Response) {
  const { tenantId } = req.auth!;
  const { clientId, reason } = blockClientSchema.parse(req.body);

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new HttpError(404, "Client not found");

  // Only a client this salon has actually dealt with — otherwise the endpoint
  // would let one salon enumerate the platform's whole client table.
  const hasHistory = await prisma.appointment.findFirst({
    where: { tenantId, clientId },
    select: { id: true },
  });
  if (!hasHistory) throw new HttpError(403, "This client has no booking history with your salon.");

  const block = await prisma.blockedClient.upsert({
    where: { tenantId_clientId: { tenantId, clientId } },
    create: { tenantId, clientId, reason },
    update: { reason },
  });

  return res.status(201).json({ success: true, block });
}

export async function unblockClient(req: AuthRequest, res: Response) {
  const { tenantId } = req.auth!;
  const { clientId } = req.params;

  await prisma.blockedClient.deleteMany({ where: { tenantId, clientId } });
  return res.json({ success: true, message: "Client unblocked." });
}
