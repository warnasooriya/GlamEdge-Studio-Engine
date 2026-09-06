import { z } from "zod";

export const createReportSchema = z.object({
  targetType: z.enum(["REVIEW", "MESSAGE", "FEED_POST"]),
  targetId: z.string().min(1).max(191),
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "HATE_SPEECH",
    "SEXUAL_CONTENT",
    "VIOLENCE",
    "IMPERSONATION",
    "OTHER",
  ]),
  details: z.string().max(1000).optional(),
});

export const blockClientSchema = z.object({
  clientId: z.string().min(1).max(191),
  reason: z.string().max(200).optional(),
});
