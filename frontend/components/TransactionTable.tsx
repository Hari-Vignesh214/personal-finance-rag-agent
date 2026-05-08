"use client";

import { useEffect, useMemo, useState } from "react";
import { listTransactions } from "@/lib/api";
import type { Category, Transaction } from "@/lib/types";

const CATEGORIES: Category[] = [
  "groceries",
  "dining",
  "transport",
  "entertainment",
  "utilities",
  "rent_housing",
  "healthcare",
  "shopping",
  "subscriptions",
  "travel",
  "transfer",
  "income",
  "fees",
  "other",
];

const CATEGORY_COLORS: Record<Category, string> = {
  groceries: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  dining: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  transport: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  utilities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  rent_housing: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  healthcare: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  shopping: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  subscriptions: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  travel: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  transfer: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  income: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  fees: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  other: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function formatAmount(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-$${abs}` : `+$${abs}`;
}

export function TransactionTable({ refreshKey }: { refreshKey: number }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTransactions({ limit: 500 })
      .then((data) => {
        if (!cancelled) setTxs(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filtered = useMemo(
    () => (filter === "all" ? txs : txs.filter((t) => t.category === filter)),
    [txs, filter],
  );

  const totals = useMemo(() => {
    const expenses = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
    const income = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    return { expenses, income, count: filtered.length };
  }, [filtered]);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 flex-wrap">
        <h2 className="font-semibold text-sm">Transactions</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Category | "all")}
          className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
        <div className="ml-auto text-xs text-zinc-500 flex gap-3">
          <span>{totals.count} rows</span>
          <span className="text-red-600 dark:text-red-400">
            out: {formatAmount(totals.expenses)}
          </span>
          <span className="text-emerald-700 dark:text-emerald-400">
            in: {formatAmount(totals.income)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-6 text-sm text-zinc-500">Loading…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-zinc-500">
            No transactions yet. Upload a statement to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-2">Date</th>
                <th className="text-left font-medium px-4 py-2">Description</th>
                <th className="text-left font-medium px-4 py-2">Category</th>
                <th className="text-right font-medium px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-900">
                  <td className="px-4 py-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {t.date}
                  </td>
                  <td className="px-4 py-2">{t.description}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[t.category]}`}
                    >
                      {t.category.replace("_", " ")}
                    </span>
                  </td>
                  <td
                    className={
                      "px-4 py-2 text-right font-mono " +
                      (t.amount < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-700 dark:text-emerald-400")
                    }
                  >
                    {formatAmount(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
