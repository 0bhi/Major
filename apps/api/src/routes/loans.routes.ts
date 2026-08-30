import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { loanSchema } from "../lib/schemas.js";
import { serializeLoan } from "../lib/serialize.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

export const loansRouter = Router();
loansRouter.use(requireAuth);

loansRouter.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const rows = await prisma.loan.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
  res.json(rows.map(serializeLoan));
});

loansRouter.post("/", validateBody(loanSchema), async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const body = req.body as {
    name: string;
    type: string;
    principal: number;
    interestRate: number;
    emi: number;
    remaining: number;
    startDate: string;
    endDate: string;
  };
  const row = await prisma.loan.create({
    data: {
      userId,
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    },
  });
  res.status(201).json(serializeLoan(row));
});

loansRouter.put("/:id", validateBody(loanSchema), async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const body = req.body as {
    name: string;
    type: string;
    principal: number;
    interestRate: number;
    emi: number;
    remaining: number;
    startDate: string;
    endDate: string;
  };
  const existing = await prisma.loan.findFirst({
    where: { id: String(req.params.id), userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  const row = await prisma.loan.update({
    where: { id: existing.id },
    data: {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    },
  });
  res.json(serializeLoan(row));
});

loansRouter.delete("/:id", async (req, res) => {
  const userId = (req as AuthedRequest).user.id;
  const existing = await prisma.loan.findFirst({
    where: { id: String(req.params.id), userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  await prisma.loan.delete({ where: { id: existing.id } });
  res.status(204).send();
});
