"use client";

import { useRef, useState } from "react";
import { uploadStatement } from "@/lib/api";
import type { UploadResponse } from "@/lib/types";

export function UploadDropzone({ onUploaded }: { onUploaded: (r: UploadResponse) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<UploadResponse | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const res = await uploadStatement(file);
      setLast(res);
      onUploaded(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 p-4">
      <h2 className="font-semibold text-sm mb-3">Upload statement</h2>
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors " +
          (dragOver
            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
            : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900") +
          (busy ? " opacity-60 cursor-wait" : "")
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {busy ? (
          <p className="text-sm text-zinc-500">Parsing &amp; extracting…</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drop a PDF or .txt statement here</p>
            <p className="text-xs text-zinc-500 mt-1">or click to choose a file</p>
          </>
        )}
      </div>

      {last && !busy && (
        <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">
          Extracted {last.transactions_extracted} transactions from{" "}
          <span className="font-mono">{last.filename}</span>
        </p>
      )}
      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
