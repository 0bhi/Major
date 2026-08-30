"use client";

import { INCOME_SOURCES, type Income, type IncomeInput } from "@finpilot/shared";
import { useEffect, useState } from "react";
import { EmptyState, ErrorBanner, Field, PageHeader, inputClass } from "@/components/Ui";
import { api } from "@/lib/api-client";
import { formatDate, formatInrPrecise } from "@/lib/finance";

const empty: IncomeInput = {
  source: "Salary",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

export default function IncomePage() {
  const [rows, setRows] = useState<Income[]>([]);
  const [form, setForm] = useState<IncomeInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    setRows(await api.income.list());
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  function startEdit(row: Income) {
    setEditingId(row.id);
    setForm({
      source: row.source as IncomeInput["source"],
      amount: row.amount,
      date: row.date.slice(0, 10),
      description: row.description ?? "",
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
      const payload = { ...form, description: form.description || null };
      if (editingId) await api.income.update(editingId, payload);
      else await api.income.create(payload);
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
    if (!confirm("Delete this income entry?")) return;
    await api.income.remove(id);
    await load();
  }

  return (
    <div>
      <PageHeader title="Income" subtitle="Salary, rent, business, freelance and other sources." />
      <form onSubmit={onSubmit} className="mb-8 grid gap-4 rounded-xl border border-line bg-surface p-4 md:grid-cols-2">
        <ErrorBanner message={error} />
        <Field label="Source">
          <select
            className={inputClass}
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            {INCOME_SOURCES.map((s) => (
              <option key={s}>{s}</option>
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
        <Field label="Description">
          <input
            className={inputClass}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="flex gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {editingId ? "Update income" : "Add income"}
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
        <EmptyState>No income recorded yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-bg text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{formatDate(row.date)}</td>
                  <td className="px-4 py-3">{row.source}</td>
                  <td className="px-4 py-3 text-muted">{row.description || "—"}</td>
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
