import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { createLedgerEntrySchema } from "./ledger.schema";

function dayRange(dateStr?: string) {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function listLedgerEntries(req: AuthRequest, res: Response) {
  const { from, to, type } = req.query as { from?: string; to?: string; type?: string };
  const { page, pageSize, skip, take } = parsePagination(req.query, 15, 100);

  const where = {
    tenantId: req.tenantId!,
    ...(type ? { type: type as any } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.ledger.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.ledger.count({ where }),
  ]);

  return res.json({ success: true, entries, ...paginationMeta(total, page, pageSize) });
}

export async function createLedgerEntry(req: AuthRequest, res: Response) {
  const data = createLedgerEntrySchema.parse(req.body);
  const entry = await prisma.ledger.create({ data: { ...data, tenantId: req.tenantId! } });
  return res.status(201).json({ success: true, entry });
}

export async function endOfDayReconciliation(req: AuthRequest, res: Response) {
  const { date } = req.query as { date?: string };
  const { start, end } = dayRange(date);

  const entries = await prisma.ledger.findMany({
    where: { tenantId: req.tenantId!, createdAt: { gte: start, lte: end } },
  });

  const income = entries.filter((e) => e.type === "INCOME");
  const expense = entries.filter((e) => e.type === "EXPENSE");

  const totalIncome = income.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = expense.reduce((sum, e) => sum + Number(e.amount), 0);

  const cashDrawer = entries
    .filter((e) => e.paymentMode === "CASH")
    .reduce((sum, e) => sum + (e.type === "INCOME" ? Number(e.amount) : -Number(e.amount)), 0);

  const byPaymentMode = entries.reduce<Record<string, number>>((acc, e) => {
    const sign = e.type === "INCOME" ? 1 : -1;
    acc[e.paymentMode] = (acc[e.paymentMode] || 0) + sign * Number(e.amount);
    return acc;
  }, {});

  return res.json({
    success: true,
    date: start.toISOString().slice(0, 10),
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    cashDrawer,
    byPaymentMode,
    entryCount: entries.length,
  });
}
