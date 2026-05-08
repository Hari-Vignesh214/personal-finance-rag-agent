"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

export function HealthBadge({ refreshKey }: { refreshKey: number }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((h) => !cancelled && setHealth(h))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (error) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        backend offline
      </span>
    );
  }
  if (!health) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
        <span className="w-2 h-2 rounded-full bg-zinc-300 animate-pulse" />
        connecting…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="font-mono">{health.model}</span>
      <span className="text-zinc-400">·</span>
      <span>{health.transactions_indexed} indexed</span>
    </span>
  );
}
