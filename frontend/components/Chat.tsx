"use client";

import { useEffect, useRef, useState } from "react";
import { sendChat } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { ToolCallTrace } from "./ToolCallTrace";

const SUGGESTIONS = [
  "How much did I spend on dining last month?",
  "What were my top 3 spending categories?",
  "Find any subscriptions I might have forgotten about.",
  "Show me anything that looks unusual.",
];

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat(trimmed, threadId);
      setThreadId(res.thread_id);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.reply, toolCalls: res.tool_calls },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-sm">Chat</h2>
        {threadId && (
          <span className="text-xs text-zinc-500 font-mono">
            thread: {threadId.slice(0, 8)}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              Upload a statement, then ask a question. Try one of these:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-lg px-3 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm whitespace-pre-wrap"
                  : "max-w-[85%] space-y-2"
              }
            >
              {m.role === "assistant" && m.toolCalls.length > 0 && (
                <ToolCallTrace toolCalls={m.toolCalls} />
              )}
              <div
                className={
                  m.role === "assistant"
                    ? "rounded-lg px-3 py-2 bg-zinc-100 dark:bg-zinc-900 text-sm whitespace-pre-wrap"
                    : ""
                }
              >
                {m.content || (m.role === "assistant" ? "(no reply)" : "")}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-500">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your spending..."
          className="flex-1 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
