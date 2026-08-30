import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  LOAN_TYPES,
} from "@finpilot/shared";
import { z } from "zod";

const sources = INCOME_SOURCES as unknown as [string, ...string[]];
const categories = EXPENSE_CATEGORIES as unknown as [string, ...string[]];
const loanTypes = LOAN_TYPES as unknown as [string, ...string[]];

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const incomeSchema = z.object({
  source: z.enum(sources),
  amount: z.number().positive(),
  date: z.string().min(1),
  description: z.string().trim().max(200).optional().nullable(),
});

export const expenseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(categories),
  amount: z.number().positive(),
  date: z.string().min(1),
});

export const loanSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: z.enum(loanTypes),
    principal: z.number().positive(),
    interestRate: z.number().min(0).max(100),
    emi: z.number().positive(),
    remaining: z.number().min(0),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  })
  .refine((d) => d.remaining <= d.principal, {
    message: "Remaining amount cannot exceed principal",
    path: ["remaining"],
  });
