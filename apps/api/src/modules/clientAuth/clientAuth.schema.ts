import { z } from "zod";

export const requestClientOtpSchema = z.object({
  phone: z.string().min(9).max(15),
});

export const verifyClientOtpSchema = z.object({
  phone: z.string().min(9).max(15),
  code: z.string().length(6),
  name: z.string().min(2).max(191).optional(),
});
