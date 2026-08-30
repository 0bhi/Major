import { Prisma } from "@prisma/client";

export function dec(value: Prisma.Decimal | number | string): number {
  return Number(value);
}

export function serializeIncome(row: {
  id: string;
  userId: string;
  source: string;
  amount: Prisma.Decimal;
  date: Date;
  description: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    userId: row.userId,
    source: row.source,
    amount: dec(row.amount),
    date: row.date.toISOString(),
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeExpense(row: {
  id: string;
  userId: string;
  name: string;
  category: string;
  amount: Prisma.Decimal;
  date: Date;
  createdAt: Date;
}) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    category: row.category,
    amount: dec(row.amount),
    date: row.date.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeLoan(row: {
  id: string;
  userId: string;
  name: string;
  type: string;
  principal: Prisma.Decimal;
  interestRate: Prisma.Decimal;
  emi: Prisma.Decimal;
  remaining: Prisma.Decimal;
  startDate: Date;
  endDate: Date;
}) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: row.type,
    principal: dec(row.principal),
    interestRate: dec(row.interestRate),
    emi: dec(row.emi),
    remaining: dec(row.remaining),
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
  };
}
