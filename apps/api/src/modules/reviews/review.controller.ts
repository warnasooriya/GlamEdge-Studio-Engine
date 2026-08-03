import { Response, Request } from "express";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { sendWhatsAppText } from "@/services/whatsapp/whatsappService";
import { createNotification } from "@/services/notifications/notificationService";
import { createReviewSchema } from "./review.schema";

// Verified Review Engine: only clients with a completed, billed appointment
// may leave a review, and only once per appointment — eliminates fake feedback.
export async function createVerifiedReview(req: Request, res: Response) {
  const { slug } = req.params;
  const { appointmentId, rating, comment } = createReviewSchema.parse(req.body);

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new HttpError(404, "Salon not found");

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: tenant.id,
      status: "COMPLETED",
      isBilled: true,
    },
  });

  if (!appointment) {
    throw new HttpError(
      400,
      "Only clients with a completed and billed appointment can leave reviews."
    );
  }

  const existingReview = await prisma.review.findUnique({ where: { appointmentId } });
  if (existingReview) {
    throw new HttpError(400, "Review already submitted for this visit.");
  }

  const review = await prisma.review.create({
    data: {
      tenantId: tenant.id,
      appointmentId,
      clientName: appointment.clientName,
      rating,
      comment,
      isVerified: true,
    },
  });

  try {
    await sendWhatsAppText(
      appointment.clientPhone,
      `Thank you ${appointment.clientName} for your ${rating}-star review of ${tenant.salonName}! We appreciate your feedback.`
    );
  } catch (err) {
    console.error("WhatsApp review-thanks dispatch failed:", err);
  }

  if (appointment.clientId) {
    try {
      await createNotification({
        clientId: appointment.clientId,
        tenantId: tenant.id,
        appointmentId: appointment.id,
        type: "REVIEW_THANKS",
        title: "Thanks for your review",
        message: `Thank you for your ${rating}-star review of ${tenant.salonName}! We appreciate your feedback.`,
      });
    } catch (err) {
      console.error("Notification create failed:", err);
    }
  }

  return res.status(201).json({ success: true, review });
}

export async function listPublicReviews(req: Request, res: Response) {
  const { slug } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new HttpError(404, "Salon not found");

  const { page, pageSize, skip, take } = parsePagination(req.query, 10, 50);
  const where = { tenantId: tenant.id };

  const [reviews, total, aggregate] = await Promise.all([
    prisma.review.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
  ]);

  return res.json({
    success: true,
    reviews,
    avgRating: aggregate._avg.rating ?? 0,
    count: total,
    ...paginationMeta(total, page, pageSize),
  });
}
