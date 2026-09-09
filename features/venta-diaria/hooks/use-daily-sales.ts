"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary } from "@/features/sales/api/sales.api";
import type { ApiError } from "@/lib/api/client";
import { monthDateRange, monthLabel, previousMonthOf, type MonthRef } from "@/lib/month";
import type { DailySalesPoint } from "@/features/sales/types/sales.types";

interface UseMonthSalesResult {
  monthRef: MonthRef;
  label: string;
  data: DailySalesPoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

function useMonthSales(monthRef: MonthRef, posConfigId: number | undefined): UseMonthSalesResult {
  const { dateFrom, dateTo } = monthDateRange(monthRef);
  const query = useQuery<DailySalesPoint[], ApiError>({
    queryKey: ["sales", "daily-summary", { dateFrom, dateTo, posConfigId }],
    queryFn: () => fetchDailySummary({ dateFrom, dateTo, posConfigId }),
  });

  return {
    monthRef,
    label: monthLabel(monthRef),
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error?.message,
  };
}

// Venta diaria ($, campo totalRevenue) del mes ancla y los dos meses
// anteriores — mismo endpoint /sales/daily-summary y mismo diseño que
// features/trafico-diario/hooks/use-daily-traffic.ts (que usa orderCount
// del mismo dato), para las 3 tablas del módulo "Venta Diaria" y la
// gráfica de comparación entre los dos meses previos. Comparte queryKey
// con Tráfico Diario a propósito — es el mismo fetch, react-query lo
// cachea una sola vez aunque se abran ambos módulos.
export function useDailySales(anchor: MonthRef, posConfigId: number | undefined) {
  const prev1 = previousMonthOf(anchor);
  const prev2 = previousMonthOf(prev1);

  return {
    anchor: useMonthSales(anchor, posConfigId),
    prev1: useMonthSales(prev1, posConfigId),
    prev2: useMonthSales(prev2, posConfigId),
  };
}
