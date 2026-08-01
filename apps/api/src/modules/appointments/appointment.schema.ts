import { z } from "zod";

export const categoryEnum = z.enum(["LADIES", "GENTS", "KIDS"]);
export const statusEnum = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);

export const createAppointmentSchema = z.object({
  clientName: z.string().min(1).max(191),
  clientPhone: z.string().min(9).max(50),
  category: categoryEnum,
  staffId: z.string().uuid().optional(),
  bookingTime: z.coerce.date(),
  notes: z.string().max(2000).optional(),
  serviceIds: z.array(z.string().uuid()).min(1),
});

export const updateStatusSchema = z.object({
  status: statusEnum,
});
