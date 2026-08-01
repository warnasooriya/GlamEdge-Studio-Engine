import { Response, Request } from "express";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
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

  return res.status(201).json({ success: true, review });
}

export async function listPublicReviews(req: Request, res: Response) {
  const { slug } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new HttpError(404, "Salon not found");

  const reviews = await prisma.review.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return res.json({ success: true, reviews, avgRating, count: reviews.length });
}
