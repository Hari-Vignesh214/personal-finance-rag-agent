export type Category =
  | "groceries"
  | "dining"
  | "transport"
  | "entertainment"
  | "utilities"
  | "rent_housing"
  | "healthcare"
  | "shopping"
  | "subscriptions"
  | "travel"
  | "transfer"
  | "income"
  | "fees"
  | "other";

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: Category;
  source_file?: string | null;
}

export interface UploadResponse {
  filename: string;
  transactions_extracted: number;
  transactions: Transaction[];
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ChatResponse {
  reply: string;
  tool_calls: ToolCall[];
  thread_id: string;
}

export interface HealthResponse {
  status: string;
  model: string;
  transactions_indexed: number;
}

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls: ToolCall[] };
