import { apiClient, apiGet } from "@/lib/api/client";
import type {
  UpsertWholesaleGoalsBulkPayload,
  WholesaleClient,
  WholesaleClientGoal,
  WholesaleClientTotalsReport,
  WholesaleGoalSummaryItem,
} from "../types/wholesale-goals.types";

export function fetchWholesaleClients() {
  return apiGet<WholesaleClient[]>("/wholesale-goals/clients");
}

export function fetchWholesaleGoalsSummary(year: number, month: number) {
  return apiGet<WholesaleGoalSummaryItem[]>(`/wholesale-goals/summary?year=${year}&month=${month}`);
}

// El backend expone PUT /wholesale-goals (lote) — mismo caso que
// sales-goals.api.ts, no hay helper apiPut en lib/api/client.ts.
export function upsertWholesaleGoalsBulk(payload: UpsertWholesaleGoalsBulkPayload) {
  return apiClient.put<WholesaleClientGoal[]>("/wholesale-goals", payload).then((res) => res.data);
}

// Desglose por comprador (ver /sales/by-wholesale-client en xoco-api) —
// mismo rango de fechas que el resto de reportes basados en facturas.
export function fetchWholesaleClientTotals(dateFrom: string, dateTo: string) {
  return apiGet<WholesaleClientTotalsReport>(
    `/sales/by-wholesale-client?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}
