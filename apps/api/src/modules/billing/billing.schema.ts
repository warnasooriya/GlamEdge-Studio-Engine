import { z } from "zod";

export const createInvoiceSchema = z.object({
  paymentMode: z.enum(["CASH", "CARD", "ONLINE", "LANKAQR", "PAYPAL"]).default("CASH"),
});
