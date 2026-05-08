import type {
  ChatResponse,
  HealthResponse,
  Transaction,
  UploadResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE}/api/health`);
  return jsonOrThrow<HealthResponse>(res);
}

export async function listTransactions(opts: {
  limit?: number;
  category?: string;
  since?: string;
} = {}): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.category) params.set("category", opts.category);
  if (opts.since) params.set("since", opts.since);
  const qs = params.toString();
  const res = await fetch(`${BASE}/api/transactions${qs ? `?${qs}` : ""}`);
  return jsonOrThrow<Transaction[]>(res);
}

export async function uploadStatement(file: File): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: fd });
  return jsonOrThrow<UploadResponse>(res);
}

export async function sendChat(
  message: string,
  threadId?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, thread_id: threadId ?? null }),
  });
  return jsonOrThrow<ChatResponse>(res);
}
