import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const rejectTenantSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const updateSubscriptionSchema = z.object({
  subscription: z.enum(["STARTER", "PRO", "ENTERPRISE"]).optional(),
  subscriptionCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  subscriptionFee: z.coerce.number().min(0).max(9999999).optional(),
  subscriptionExpiresAt: z.coerce.date().optional(),
  renew: z.boolean().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().min(0).max(9999999),
  paymentMode: z.enum(["CASH", "CARD", "ONLINE", "LANKAQR"]).default("CASH"),
  reference: z.string().max(191).optional(),
  notes: z.string().max(500).optional(),
  paidAt: z.coerce.date().optional(),
  // When true (the default) the payment also advances the salon's subscription
  // window by one cycle, so recording a renewal is a single action.
  extendSubscription: z.boolean().default(true),
});
