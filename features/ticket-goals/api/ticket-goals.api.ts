import { apiClient, apiGet } from "@/lib/api/client";
import type {
  TicketGoalSummaryItem,
  StoreTicketGoal,
  UpsertTicketGoalsBulkPayload,
} from "../types/ticket-goals.types";

export function fetchTicketGoalsSummary(year: number, month: number) {
  return apiGet<TicketGoalSummaryItem[]>(`/ticket-goals/summary?year=${year}&month=${month}`);
}

// El backend expone PUT /ticket-goals (lote) — mismo caso que
// goals.api.ts/sales-goals.api.ts, no hay helper apiPut en
// lib/api/client.ts.
export function upsertTicketGoalsBulk(payload: UpsertTicketGoalsBulkPayload) {
  return apiClient.put<StoreTicketGoal[]>("/ticket-goals", payload).then((res) => res.data);
}
