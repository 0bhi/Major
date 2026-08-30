"use client";

import { LOAN_TYPES, type Loan, type LoanInput } from "@finpilot/shared";
import { useEffect, useState } from "react";
import { EmptyState, ErrorBanner, Field, PageHeader, inputClass } from "@/components/Ui";
import { api } from "@/lib/api-client";
import { formatDate, formatInrPrecise, loanProgress } from "@/lib/finance";

const empty: LoanInput = {
  name: "",
  type: "Personal",
  principal: 0,
  interestRate: 0,
  emi: 0,
  remaining: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
};

export default function LoansPage() {
  const [rows, setRows] = useState<Loan[]>([]);
  const [form, setForm] = useState<LoanInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    setRows(await api.loans.list());
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  function startEdit(row: Loan) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      type: row.type,
      principal: row.principal,
      interestRate: row.interestRate,
      emi: row.emi,
      remaining: row.remaining,
      startDate: row.startDate.slice(0, 10),
      endDate: row.endDate.slice(0, 10),
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.remaining > form.principal) {
      setError("Remaining amount cannot exceed principal");
      return;
    }
    setPending(true);
    try {
      if (editingId) await api.loans.update(editingId, form);
      else await api.loans.create(form);
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
    if (!confirm("Delete this loan?")) return;
    await api.loans.remove(id);
    await load();
  }

  return (
    <div>
      <PageHeader title="Loans / EMI" subtitle="Principal, interest, EMI and remaining balance." />
      <form onSubmit={onSubmit} className="mb-8 grid gap-4 rounded-xl border border-line bg-surface p-4 md:grid-cols-2">
        <ErrorBanner message={error} />
        <Field label="Loan name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <Field label="Type">
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {LOAN_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Principal (₹)">
          <input
            className={inputClass}
            type="number"
            min={0.01}
            step="0.01"
            value={form.principal || ""}
            onChange={(e) => setForm({ ...form, principal: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Interest rate (%)">
          <input
            className={inputClass}
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={form.interestRate}
            onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="EMI (₹)">
          <input
            className={inputClass}
            type="number"
            min={0.01}
            step="0.01"
            value={form.emi || ""}
            onChange={(e) => setForm({ ...form, emi: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Remaining (₹)">
          <input
            className={inputClass}
            type="number"
            min={0}
            step="0.01"
            value={form.remaining}
            onChange={(e) => setForm({ ...form, remaining: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Start date">
          <input
            className={inputClass}
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </Field>
        <Field label="End date">
          <input
            className={inputClass}
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
        </Field>
        <div className="flex gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {editingId ? "Update loan" : "Add loan"}
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
        <EmptyState>No loans recorded yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const pct = loanProgress(row.principal, row.remaining);
            return (
              <article key={row.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{row.name}</h2>
                    <p className="text-sm text-muted">
                      {row.type} · {formatDate(row.startDate)} → {formatDate(row.endDate)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>EMI {formatInrPrecise(row.emi)}</p>
                    <p className="text-muted">{row.interestRate}% p.a.</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
                  <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span>Paid {pct.toFixed(1)}%</span>
                  <span>
                    Remaining {formatInrPrecise(row.remaining)} of {formatInrPrecise(row.principal)}
                  </span>
                </div>
                <div className="mt-3 text-right">
                  <button className="mr-3 text-sm text-brand" onClick={() => startEdit(row)}>
                    Edit
                  </button>
                  <button className="text-sm text-danger" onClick={() => remove(row.id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
