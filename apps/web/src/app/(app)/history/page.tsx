"use client";

import { EXPENSE_CATEGORIES, INCOME_SOURCES, type Expense, type Income } from "@finpilot/shared";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Field, PageHeader, inputClass } from "@/components/Ui";
import { api } from "@/lib/api-client";
import { formatDate, formatInrPrecise } from "@/lib/finance";

type Row = {
  id: string;
  kind: "Income" | "Expense";
  title: string;
  category: string;
  amount: number;
  date: string;
};

export default function HistoryPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [kind, setKind] = useState<"all" | "Income" | "Expense">("all");
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.income.list(), api.expenses.list()])
      .then(([i, e]) => {
        setIncomes(i);
        setExpenses(e);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  const rows: Row[] = useMemo(() => {
    const merged: Row[] = [
      ...incomes.map((i) => ({
        id: `i-${i.id}`,
        kind: "Income" as const,
        title: i.source,
        category: i.source,
        amount: i.amount,
        date: i.date,
      })),
      ...expenses.map((e) => ({
        id: `e-${e.id}`,
        kind: "Expense" as const,
        title: e.name,
        category: e.category,
        amount: e.amount,
        date: e.date,
      })),
    ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

    return merged.filter((r) => {
      if (kind !== "all" && r.kind !== kind) return false;
      if (category !== "all" && r.category !== category) return false;
      const t = +new Date(r.date);
      if (from && t < +new Date(from)) return false;
      if (to && t > +new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [incomes, expenses, kind, category, from, to]);

  const categoryOptions =
    kind === "Income" ? INCOME_SOURCES : kind === "Expense" ? EXPENSE_CATEGORIES : [...INCOME_SOURCES, ...EXPENSE_CATEGORIES];

  return (
    <div>
      <PageHeader title="Transaction history" subtitle="All income and expenses, filterable." />
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <div className="mb-6 grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-4">
        <Field label="Type">
          <select className={inputClass} value={kind} onChange={(e) => { setKind(e.target.value as typeof kind); setCategory("all"); }}>
            <option value="all">All</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
        </Field>
        <Field label="Category / source">
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {categoryOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input className={inputClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <input className={inputClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>

      {rows.length === 0 ? (
        <EmptyState>No matching transactions.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-bg text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{formatDate(row.date)}</td>
                  <td className="px-4 py-3">{row.kind}</td>
                  <td className="px-4 py-3">{row.title}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className={`px-4 py-3 font-medium ${row.kind === "Income" ? "text-ok" : ""}`}>
                    {row.kind === "Income" ? "+" : "−"}
                    {formatInrPrecise(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
