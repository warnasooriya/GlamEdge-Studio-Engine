import { z } from "zod";

export const requestOtpSchema = z.object({
  phone: z.string().min(9).max(15),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(9).max(15),
  code: z.string().length(6),
  salonName: z.string().min(2).max(191).optional(),
  ownerName: z.string().min(2).max(191).optional(),
});
