import type { FinancialHealth } from "./types";

export function calcSavings(income: number, expenses: number): number {
  return round2(income - expenses);
}

export function calcSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return round2((calcSavings(income, expenses) / income) * 100);
}

export function categoryPercentage(
  categoryExpense: number,
  totalExpense: number,
): number {
  if (totalExpense <= 0) return 0;
  return round2((categoryExpense / totalExpense) * 100);
}

export function loanProgress(principal: number, remaining: number): number {
  if (principal <= 0) return 0;
  const paid = principal - remaining;
  return round2(Math.min(100, Math.max(0, (paid / principal) * 100)));
}

export function debtBurden(totalEmi: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  return round2((totalEmi / monthlyIncome) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function financialHealthScore(
  monthlyIncome: number,
  monthlyExpenses: number,
  totalEmi: number,
): FinancialHealth {
  const savingsRate = calcSavingsRate(monthlyIncome, monthlyExpenses);

  const savingsRateScore = clamp(savingsRate, 0, 30) / 30 * 100;

  const expenseControlScore =
    monthlyIncome <= 0
      ? 0
      : clamp(1 - monthlyExpenses / monthlyIncome, 0, 1) * 100;

  const ratio = monthlyIncome <= 0 ? 1 : totalEmi / monthlyIncome;
  const debtScore = clamp((0.4 - ratio) / 0.4, 0, 1) * 100;

  const score = round2(
    savingsRateScore * 0.4 + expenseControlScore * 0.3 + debtScore * 0.3,
  );

  let label: FinancialHealth["label"];
  if (score >= 80) label = "Excellent";
  else if (score >= 60) label = "Good";
  else if (score >= 40) label = "Fair";
  else label = "Needs attention";

  return {
    score,
    label,
    breakdown: {
      savingsRateScore: round2(savingsRateScore),
      expenseControlScore: round2(expenseControlScore),
      debtScore: round2(debtScore),
    },
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function monthsAgo(from: Date, count: number): Date {
  return new Date(from.getFullYear(), from.getMonth() - count, 1);
}

export function monthKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatInrPrecise(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
