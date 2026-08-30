import { Router } from "express";
import {
  calcSavings,
  calcSavingsRate,
  financialHealthScore,
  endOfMonth,
  startOfMonth,
} from "../services/financial-engine.js";
import { prisma } from "../lib/prisma.js";
import { dec } from "../lib/serialize.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

async function monthTotals(userId: string) {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const [incomeAgg, expenseAgg, loans] = await Promise.all([
    prisma.income.aggregate({
      where: { userId, date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.loan.findMany({ where: { userId } }),
  ]);

  const income = dec(incomeAgg._sum.amount ?? 0);
  const expenses = dec(expenseAgg._sum.amount ?? 0);
  const loanBalance = loans.reduce((s, l) => s + dec(l.remaining), 0);
  const totalEmi = loans.reduce((s, l) => s + dec(l.emi), 0);
  const savings = calcSavings(income, expenses);
  const savingsRate = calcSavingsRate(income, expenses);

  return { income, expenses, savings, savingsRate, loanBalance, totalEmi };
}

analyticsRouter.get("/summary", async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const summary = await monthTotals(userId);
  res.json(summary);
});

analyticsRouter.get("/financial-health", async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const { income, expenses, totalEmi } = await monthTotals(userId);
  res.json(financialHealthScore(income, expenses, totalEmi));
});
