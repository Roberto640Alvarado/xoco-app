import type { AiProviderKey } from "./ai-chat.types";

export type AiKeyStatus = "OK" | "SIN_CREDITO" | "INVALIDA" | "ERROR";

export interface AiKeyInfo {
  provider: AiProviderKey;
  label: string;
  model: string;
  source: "panel" | "servidor" | null;
  last4: string | null;
  status: AiKeyStatus | null;
  statusMessage: string | null;
  checkedAt: string | null;
  updatedByEmail: string | null;
  updatedAt: string | null;
}

export interface AiKeyCheckResult {
  check: { status: AiKeyStatus; message: string };
  keys: AiKeyInfo[];
}

export interface AiUsageItem {
  id: string;
  createdAt: string;
  provider: AiProviderKey;
  model: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  steps: number;
  toolCalls: number;
  status: "OK" | "ERROR" | "DETENIDA";
  errorMessage: string | null;
  durationMs: number;
}

export interface AiUsageResponse {
  dateFrom: string;
  dateTo: string;
  totals: { costUsd: number; queries: number; inputTokens: number; outputTokens: number; errors: number; averageCostUsd: number };
  byDay: { date: string; costUsd: number; queries: number; claude: number; openai: number }[];
  byProvider: { provider: AiProviderKey; model: string; costUsd: number; queries: number; inputTokens: number; outputTokens: number }[];
  byUser: { userId: string; userEmail: string; userName: string | null; costUsd: number; queries: number }[];
  items: AiUsageItem[];
  page: number;
  limit: number;
  total: number;
}

export interface AiUsageFilters {
  dateFrom: string;
  dateTo: string;
  provider?: AiProviderKey;
  userId?: string;
  page: number;
  limit: number;
}
