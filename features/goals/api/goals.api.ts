import { apiClient, apiGet } from "@/lib/api/client";
import type { GoalSummaryItem, StoreGoal, UpsertGoalsBulkPayload } from "../types/goals.types";

export function fetchGoalsSummary(year: number, month: number) {
  return apiGet<GoalSummaryItem[]>(`/goals/summary?year=${year}&month=${month}`);
}

// El backend expone PUT /goals (lote) — no hay helper apiPut en
// lib/api/client.ts todavía (mismo caso que features/odoo-config), se usa
// apiClient directo.
export function upsertGoalsBulk(payload: UpsertGoalsBulkPayload) {
  return apiClient.put<StoreGoal[]>("/goals", payload).then((res) => res.data);
}
