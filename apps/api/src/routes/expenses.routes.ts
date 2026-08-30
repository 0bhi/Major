import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { expenseSchema } from "../lib/schemas.js";
import { serializeExpense } from "../lib/serialize.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

export const expensesRouter = Router();
expensesRouter.use(requireAuth);

expensesRouter.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const rows = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  res.json(rows.map(serializeExpense));
});

expensesRouter.post("/", validateBody(expenseSchema), async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const body = req.body as {
    name: string;
    category: string;
    amount: number;
    date: string;
  };
  const row = await prisma.expense.create({
    data: {
      userId,
      name: body.name,
      category: body.category,
      amount: body.amount,
      date: new Date(body.date),
    },
  });
  res.status(201).json(serializeExpense(row));
});

expensesRouter.put("/:id", validateBody(expenseSchema), async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const body = req.body as {
    name: string;
    category: string;
    amount: number;
    date: string;
  };
  const existing = await prisma.expense.findFirst({
    where: { id: String(req.params.id), userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  const row = await prisma.expense.update({
    where: { id: existing.id },
    data: {
      name: body.name,
      category: body.category,
      amount: body.amount,
      date: new Date(body.date),
    },
  });
  res.json(serializeExpense(row));
});

expensesRouter.delete("/:id", async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const existing = await prisma.expense.findFirst({
    where: { id: String(req.params.id), userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  await prisma.expense.delete({ where: { id: existing.id } });
  res.status(204).send();
});
