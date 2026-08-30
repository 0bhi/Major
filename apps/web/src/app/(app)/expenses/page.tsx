"use client";

import { EXPENSE_CATEGORIES, type Expense, type ExpenseInput } from "@finpilot/shared";
import { useEffect, useState } from "react";
import { EmptyState, ErrorBanner, Field, PageHeader, inputClass } from "@/components/Ui";
import { api } from "@/lib/api-client";
import { formatDate, formatInrPrecise } from "@/lib/finance";

const empty: ExpenseInput = {
  name: "",
  category: "Food",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
};

export default function ExpensesPage() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [form, setForm] = useState<ExpenseInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    setRows(await api.expenses.list());
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  function startEdit(row: Expense) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      category: row.category,
      amount: row.amount,
      date: row.date.slice(0, 10),
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setPending(true);
    try {
      if (editingId) await api.expenses.update(editingId, form);
      else await api.expenses.create(form);
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this expense?")) return;
    await api.expenses.remove(id);
    await load();
  }

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Where the money goes, by category." />
      <form onSubmit={onSubmit} className="mb-8 grid gap-4 rounded-xl border border-line bg-surface p-4 md:grid-cols-2">
        <ErrorBanner message={error} />
        <Field label="Expense name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <Field label="Category">
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount (₹)">
          <input
            className={inputClass}
            type="number"
            min={0.01}
            step="0.01"
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Date">
          <input
            className={inputClass}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </Field>
        <div className="flex gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {editingId ? "Update expense" : "Add expense"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="rounded-lg border border-line px-4 py-2 text-sm"
              onClick={() => {
                setEditingId(null);
                setForm(empty);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No expenses recorded yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-bg text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{formatDate(row.date)}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3 font-medium">{formatInrPrecise(row.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="mr-3 text-brand" onClick={() => startEdit(row)}>
                      Edit
                    </button>
                    <button className="text-danger" onClick={() => remove(row.id)}>
                      Delete
                    </button>
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
