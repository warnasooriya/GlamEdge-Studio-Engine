import { z } from "zod";

export const categoryEnum = z.enum(["LADIES", "GENTS", "KIDS"]);

export const createServiceSchema = z.object({
  category: categoryEnum,
  name: z.string().min(1).max(191),
  price: z.number().nonnegative(),
  durationMin: z.number().int().positive().default(30),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});
