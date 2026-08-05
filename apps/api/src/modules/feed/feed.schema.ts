import { z } from "zod";

export const createPostSchema = z.object({
  category: z.enum(["LADIES", "GENTS", "KIDS"]),
  caption: z.string().max(500).optional(),
  staffId: z.string().uuid().optional(),
  staffName: z.string().max(191).optional(),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((t) => t.trim()).filter(Boolean) : [])),
});

export const likeSchema = z.object({
  visitorId: z.string().min(6).max(100),
});

export const commentSchema = z.object({
  text: z.string().min(1).max(500),
});
