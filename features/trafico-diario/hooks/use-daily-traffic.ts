"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary } from "@/features/sales/api/sales.api";
import type { ApiError } from "@/lib/api/client";
import { monthDateRange, monthLabel, previousMonthOf, type MonthRef } from "@/lib/month";
import type { DailySalesPoint } from "@/features/sales/types/sales.types";

interface UseMonthTrafficResult {
  monthRef: MonthRef;
  label: string;
  data: DailySalesPoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

function useMonthTraffic(monthRef: MonthRef, posConfigId: number | undefined): UseMonthTrafficResult {
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

// Tráfico diario del mes ancla y los dos meses anteriores (mismo endpoint
// /sales/daily-summary de siempre, 3 rangos distintos) — para las 3 tablas
// del módulo "Tráfico Diario" y la gráfica de comparación entre los dos
// meses previos.
export function useDailyTraffic(anchor: MonthRef, posConfigId: number | undefined) {
  const prev1 = previousMonthOf(anchor);
  const prev2 = previousMonthOf(prev1);

  return {
    anchor: useMonthTraffic(anchor, posConfigId),
    prev1: useMonthTraffic(prev1, posConfigId),
    prev2: useMonthTraffic(prev2, posConfigId),
  };
}
