"use client";

import { useState } from "react";
import type { ToolCall } from "@/lib/types";

const TOOL_LABELS: Record<string, string> = {
  query_transactions_sql: "SQL",
  search_transactions_semantic: "Vector",
  calculator: "Calc",
};

export function ToolCallTrace({ toolCalls }: { toolCalls: ToolCall[] }) {
  const [open, setOpen] = useState(false);
  if (toolCalls.length === 0) return null;

  return (
    <div className="text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <span>{open ? "▼" : "▶"}</span>
        <span>
          {toolCalls.length} tool {toolCalls.length === 1 ? "call" : "calls"}:
        </span>
        <span className="flex gap-1">
          {toolCalls.map((c, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono"
            >
              {TOOL_LABELS[c.name] ?? c.name}
            </span>
          ))}
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {toolCalls.map((c, i) => (
            <div
              key={i}
              className="rounded border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50 dark:bg-zinc-900/50"
            >
              <div className="font-mono text-zinc-600 dark:text-zinc-400 mb-1">{c.name}</div>
              <pre className="text-[11px] font-mono whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-300">
                {JSON.stringify(c.args, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
