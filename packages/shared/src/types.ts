export type UserPublic = {
  id: string;
  name: string;
  email: string;
};

export type Income = {
  id: string;
  userId: string;
  source: string;
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
};

export type Expense = {
  id: string;
  userId: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  createdAt: string;
};

export type Loan = {
  id: string;
  userId: string;
  name: string;
  type: string;
  principal: number;
  interestRate: number;
  emi: number;
  remaining: number;
  startDate: string;
  endDate: string;
};

export type IncomeInput = {
  source: string;
  amount: number;
  date: string;
  description?: string | null;
};

export type ExpenseInput = {
  name: string;
  category: string;
  amount: number;
  date: string;
};

export type LoanInput = {
  name: string;
  type: string;
  principal: number;
  interestRate: number;
  emi: number;
  remaining: number;
  startDate: string;
  endDate: string;
};

export type AnalyticsSummary = {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  loanBalance: number;
  totalEmi: number;
};

export type FinancialHealth = {
  score: number;
  label: "Excellent" | "Good" | "Fair" | "Needs attention";
  breakdown: {
    savingsRateScore: number;
    expenseControlScore: number;
    debtScore: number;
  };
};

export type AuthResponse = {
  accessToken: string;
  user: UserPublic;
};
