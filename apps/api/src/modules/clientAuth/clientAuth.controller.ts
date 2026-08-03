import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { otpProvider } from "@/services/otp";
import { issueOtp, verifyOtp, consumeOtp } from "@/services/otp/otpStore";
import { signClientToken } from "@/utils/clientJwt";
import { ClientAuthRequest } from "@/middlewares/requireClientAuth";
import { requestClientOtpSchema, verifyClientOtpSchema } from "./clientAuth.schema";

const updateClientSchema = z.object({
  name: z.string().min(2).max(191),
});

export async function requestClientOtp(req: Request, res: Response) {
  const { phone } = requestClientOtpSchema.parse(req.body);
  const code = await issueOtp(phone);
  await otpProvider.send(phone, code);
  return res.json({ success: true, message: "OTP sent" });
}

export async function verifyClientOtpAndAuth(req: Request, res: Response) {
  const { phone, code, name } = verifyClientOtpSchema.parse(req.body);

  const isValid = await verifyOtp(phone, code);
  if (!isValid) {
    throw new HttpError(400, "Invalid or expired OTP code");
  }

  let client = await prisma.client.findUnique({ where: { phone } });

  if (!client) {
    if (!name) {
      throw new HttpError(400, "name is required to register a new client");
    }
    client = await prisma.client.create({ data: { phone, name } });
  }

  await consumeOtp(phone);

  const token = signClientToken({ clientId: client.id, phone: client.phone, role: "client" });
  return res.status(200).json({ success: true, token, client });
}

export async function getClientMe(req: ClientAuthRequest, res: Response) {
  const client = await prisma.client.findUnique({ where: { id: req.clientAuth!.clientId } });
  if (!client) throw new HttpError(404, "Client not found");
  return res.json({ success: true, client });
}

export async function updateClientMe(req: ClientAuthRequest, res: Response) {
  const data = updateClientSchema.parse(req.body);
  const client = await prisma.client.update({
    where: { id: req.clientAuth!.clientId },
    data,
  });
  return res.json({ success: true, client });
}
