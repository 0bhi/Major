import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { incomeSchema } from "../lib/schemas.js";
import { serializeIncome } from "../lib/serialize.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

export const incomeRouter = Router();
incomeRouter.use(requireAuth);

incomeRouter.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const rows = await prisma.income.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  res.json(rows.map(serializeIncome));
});

incomeRouter.post("/", validateBody(incomeSchema), async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const body = req.body as {
    source: string;
    amount: number;
    date: string;
    description?: string | null;
  };
  const row = await prisma.income.create({
    data: {
      userId,
      source: body.source,
      amount: body.amount,
      date: new Date(body.date),
      description: body.description ?? null,
    },
  });
  res.status(201).json(serializeIncome(row));
});

incomeRouter.put("/:id", validateBody(incomeSchema), async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const body = req.body as {
    source: string;
    amount: number;
    date: string;
    description?: string | null;
  };
  const existing = await prisma.income.findFirst({
    where: { id: String(req.params.id), userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Income not found" });
    return;
  }
  const row = await prisma.income.update({
    where: { id: existing.id },
    data: {
      source: body.source,
      amount: body.amount,
      date: new Date(body.date),
      description: body.description ?? null,
    },
  });
  res.json(serializeIncome(row));
});

incomeRouter.delete("/:id", async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const existing = await prisma.income.findFirst({
    where: { id: String(req.params.id), userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Income not found" });
    return;
  }
  await prisma.income.delete({ where: { id: existing.id } });
  res.status(204).send();
});
