"use client";

import { useEffect, useState } from "react";
import type { AnalyticsSummary, Expense, FinancialHealth, Income, Loan } from "@finpilot/shared";
import { DashboardCharts } from "@/components/DashboardCharts";
import { PageHeader } from "@/components/Ui";
import { api } from "@/lib/api-client";
import { formatDate, formatInr } from "@/lib/finance";

type Tx = {
  id: string;
  kind: "Income" | "Expense";
  title: string;
  amount: number;
  date: string;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, h, i, e, l] = await Promise.all([
          api.analytics.summary(),
          api.analytics.health(),
          api.income.list(),
          api.expenses.list(),
          api.loans.list(),
        ]);
        if (cancelled) return;
        setSummary(s);
        setHealth(h);
        setIncomes(i);
        setExpenses(e);
        setLoans(l);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recent: Tx[] = [
    ...incomes.map((i) => ({
      id: i.id,
      kind: "Income" as const,
      title: i.source,
      amount: i.amount,
      date: i.date,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      kind: "Expense" as const,
      title: e.name,
      amount: e.amount,
      date: e.date,
    })),
  ]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 8);

  const healthTone =
    health && health.score >= 80
      ? "bg-ok/10 text-ok"
      : health && health.score >= 60
        ? "bg-brand/10 text-brand"
        : health && health.score >= 40
          ? "bg-accent/15 text-ink"
          : "bg-danger/10 text-danger";

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="This month’s totals, a rule-based health score, and recent activity."
      />
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {health ? (
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${healthTone}`}>
            Health {health.score} — {health.label}
          </span>
        ) : (
          <span className="text-sm text-muted">Calculating health…</span>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card label="Monthly income" value={summary ? formatInr(summary.income) : "—"} />
        <Card label="Monthly expenses" value={summary ? formatInr(summary.expenses) : "—"} />
        <Card label="Savings" value={summary ? formatInr(summary.savings) : "—"} />
        <Card
          label="Savings rate"
          value={summary ? `${summary.savingsRate.toFixed(1)}%` : "—"}
        />
        <Card label="Loan balance" value={summary ? formatInr(summary.loanBalance) : "—"} />
      </div>

      <DashboardCharts incomes={incomes} expenses={expenses} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="text-sm font-medium">Recent transactions</h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No transactions yet. Add income or expenses.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((t) => (
                <li key={`${t.kind}-${t.id}`} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted">
                      {t.kind} · {formatDate(t.date)}
                    </p>
                  </div>
                  <span className={t.kind === "Income" ? "text-ok" : "text-ink"}>
                    {t.kind === "Income" ? "+" : "−"}
                    {formatInr(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="text-sm font-medium">Active loans</h2>
          {loans.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No loans on file.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {loans.map((l) => (
                <li key={l.id} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{l.name}</span>
                    <span>{formatInr(l.remaining)}</span>
                  </div>
                  <p className="text-xs text-muted">
                    EMI {formatInr(l.emi)} · {l.type}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
