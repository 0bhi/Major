"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { categoryPercentage, monthKey } from "@/lib/finance";
import type { Expense, Income } from "@finpilot/shared";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const brand = "#0f6e5b";
const ink = "#c4a35a";
const muted = "#8aa39c";

function lastSixKeys() {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", {
    month: "short",
  });
}

function currentMonthKey() {
  return monthKey(new Date());
}

export function DashboardCharts({
  incomes,
  expenses,
}: {
  incomes: Income[];
  expenses: Expense[];
}) {
  const keys = lastSixKeys();
  const incomeByMonth = keys.map((k) =>
    incomes.filter((i) => monthKey(i.date) === k).reduce((s, i) => s + i.amount, 0),
  );
  const expenseByMonth = keys.map((k) =>
    expenses.filter((e) => monthKey(e.date) === k).reduce((s, e) => s + e.amount, 0),
  );
  const savingsByMonth = keys.map((_, i) => incomeByMonth[i] - expenseByMonth[i]);

  const thisMonth = currentMonthKey();
  const monthExpenses = expenses.filter((e) => monthKey(e.date) === thisMonth);
  const byCat = new Map<string, number>();
  for (const e of monthExpenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  }
  const catLabels = [...byCat.keys()];
  const catValues = [...byCat.values()];
  const catTotal = catValues.reduce((s, n) => s + n, 0);

  const common = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-line bg-surface p-4 lg:col-span-2">
        <h2 className="text-sm font-medium">Income vs expenses (6 months)</h2>
        <div className="mt-3 h-64">
          <Bar
            options={{
              ...common,
              plugins: { legend: { display: true, position: "bottom" } },
              scales: { y: { beginAtZero: true } },
            }}
            data={{
              labels: keys.map(monthLabel),
              datasets: [
                { label: "Income", data: incomeByMonth, backgroundColor: brand },
                { label: "Expenses", data: expenseByMonth, backgroundColor: ink },
              ],
            }}
          />
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-medium">This month by category</h2>
        <div className="mt-3 h-64">
          {catLabels.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted">
              No expenses this month
            </p>
          ) : (
            <Doughnut
              options={{
                ...common,
                plugins: { legend: { display: true, position: "bottom" } },
              }}
              data={{
                labels: catLabels.map(
                  (c, i) => `${c} (${categoryPercentage(catValues[i], catTotal)}%)`,
                ),
                datasets: [
                  {
                    data: catValues,
                    backgroundColor: [
                      brand,
                      ink,
                      muted,
                      "#2f6f4e",
                      "#d97706",
                      "#7c3aed",
                      "#0ea5e9",
                      "#be185d",
                      "#4d7c0f",
                      "#0f766e",
                      "#57534e",
                    ],
                  },
                ],
              }}
            />
          )}
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-4 lg:col-span-3">
        <h2 className="text-sm font-medium">Savings trend</h2>
        <div className="mt-3 h-56">
          <Line
            options={{
              ...common,
              scales: { y: { beginAtZero: true } },
            }}
            data={{
              labels: keys.map(monthLabel),
              datasets: [
                {
                  label: "Savings",
                  data: savingsByMonth,
                  borderColor: brand,
                  backgroundColor: "rgba(15,110,91,0.12)",
                  fill: true,
                  tension: 0.3,
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}
