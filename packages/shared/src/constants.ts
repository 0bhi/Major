export const INCOME_SOURCES = [
  "Salary",
  "Rental",
  "Business",
  "Freelance",
  "Investment",
  "Bonus",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Housing",
  "Food",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Education",
  "Healthcare",
  "Bills",
  "Subscriptions",
  "Travel",
  "Other",
] as const;

export const LOAN_TYPES = [
  "Home",
  "Car",
  "Education",
  "Personal",
  "Credit Card",
  "Other",
] as const;

export type IncomeSource = (typeof INCOME_SOURCES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type LoanType = (typeof LOAN_TYPES)[number];
