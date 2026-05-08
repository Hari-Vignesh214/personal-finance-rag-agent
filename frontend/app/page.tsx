"use client";

import { useState } from "react";
import { Chat } from "@/components/Chat";
import { HealthBadge } from "@/components/HealthBadge";
import { TransactionTable } from "@/components/TransactionTable";
import { UploadDropzone } from "@/components/UploadDropzone";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Personal Finance Agent
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Upload statements. Ask anything.
            </p>
          </div>
          <HealthBadge refreshKey={refreshKey} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-9rem)]">
          <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
            <UploadDropzone onUploaded={bumpRefresh} />
            <div className="flex-1 min-h-0">
              <TransactionTable refreshKey={refreshKey} />
            </div>
          </div>
          <div className="lg:col-span-2 min-h-0">
            <Chat />
          </div>
        </div>
      </div>
    </main>
  );
}
