import { apiClient, apiGet } from "@/lib/api/client";
import type { SalesGoalSummaryItem, StoreSalesGoal, UpsertSalesGoalsBulkPayload } from "../types/sales-goals.types";

export function fetchSalesGoalsSummary(year: number, month: number) {
  return apiGet<SalesGoalSummaryItem[]>(`/sales-goals/summary?year=${year}&month=${month}`);
}

// El backend expone PUT /sales-goals (lote) — mismo caso que goals.api.ts,
// no hay helper apiPut en lib/api/client.ts.
export function upsertSalesGoalsBulk(payload: UpsertSalesGoalsBulkPayload) {
  return apiClient.put<StoreSalesGoal[]>("/sales-goals", payload).then((res) => res.data);
}
