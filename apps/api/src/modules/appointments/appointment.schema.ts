import { z } from "zod";

export const categoryEnum = z.enum(["LADIES", "GENTS", "KIDS"]);
export const statusEnum = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);

export const createAppointmentSchema = z.object({
  clientName: z.string().min(1).max(191),
  category: categoryEnum,
  staffId: z.string().uuid().optional(),
  bookingTime: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "bookingTime must be in the future",
  }),
  notes: z.string().max(2000).optional(),
  serviceIds: z.array(z.string().uuid()).min(1),
});

export const updateStatusSchema = z.object({
  status: statusEnum,
});

export const proposeRescheduleSchema = z
  .object({
    proposedBookingTime: z.coerce.date().optional(),
    proposedStaffId: z.string().uuid().optional(),
  })
  .refine((data) => data.proposedBookingTime !== undefined || data.proposedStaffId !== undefined, {
    message: "At least one of proposedBookingTime or proposedStaffId is required",
  });

export const respondToRescheduleSchema = z.object({
  accept: z.boolean(),
});

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const createWalkInAppointmentSchema = z.object({
  clientName: z.string().max(191).optional(),
  clientPhone: z.string().max(50).optional(),
  category: categoryEnum,
  staffId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
  serviceIds: z.array(z.string().uuid()).min(1),
});
