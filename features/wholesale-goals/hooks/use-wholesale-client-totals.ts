"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWholesaleClientTotals } from "../api/wholesale-goals.api";
import type { ApiError } from "@/lib/api/client";
import type { WholesaleClientTotalsReport } from "../types/wholesale-goals.types";

// `dateFrom`/`dateTo` en null significa "sin rango válido todavía" (ver
// actualRevenueDateRange en wholesale-monthly-table.tsx: el mes en curso
// apenas empezó y no hay un "ayer" dentro de él) — la query se queda
// deshabilitada en vez de pedirle a la API un rango vacío.
export function useWholesaleClientTotals(dateFrom: string | null, dateTo: string | null) {
  return useQuery<WholesaleClientTotalsReport, ApiError>({
    queryKey: ["wholesale-goals", "client-totals", dateFrom, dateTo],
    queryFn: () => fetchWholesaleClientTotals(dateFrom!, dateTo!),
    enabled: dateFrom != null && dateTo != null,
  });
}
