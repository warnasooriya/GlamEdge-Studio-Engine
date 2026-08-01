import { z } from "zod";

export const ledgerTypeEnum = z.enum(["INCOME", "EXPENSE"]);
export const paymentModeEnum = z.enum(["CASH", "CARD", "ONLINE", "LANKAQR"]);

export const createLedgerEntrySchema = z.object({
  type: ledgerTypeEnum,
  amount: z.number().positive(),
  category: z.string().min(1).max(100),
  paymentMode: paymentModeEnum.default("CASH"),
  description: z.string().max(255).optional(),
});
