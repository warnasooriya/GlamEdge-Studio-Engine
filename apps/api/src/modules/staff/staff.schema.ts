import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().min(1).max(191),
  phone: z.string().max(50).optional(),
  role: z.string().max(100).default("Stylist"),
  commission: z.number().min(0).max(100).default(0),
});

export const updateStaffSchema = createStaffSchema.partial().extend({
  isActive: z.boolean().optional(),
});
