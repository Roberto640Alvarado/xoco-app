"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary } from "@/features/sales/api/sales.api";
import type { ApiError } from "@/lib/api/client";
import { monthDateRange, monthLabel, previousMonthOf, type MonthRef } from "@/lib/month";
import type { DailySalesPoint } from "@/features/sales/types/sales.types";

interface UseMonthTicketResult {
  monthRef: MonthRef;
  label: string;
  data: DailySalesPoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

function useMonthTicket(monthRef: MonthRef, posConfigId: number | undefined): UseMonthTicketResult {
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

// Venta + órdenes diarias (para derivar el ticket promedio, ver
// averageTicketOf en ../types) del mes ancla y los dos meses anteriores —
// mismo endpoint /sales/daily-summary y mismo diseño que
// features/trafico-diario/hooks/use-daily-traffic.ts /
// features/venta-diaria/hooks/use-daily-sales.ts. Comparte queryKey con
// esos dos módulos a propósito — es el mismo fetch, react-query lo cachea
// una sola vez.
export function useDailyTicket(anchor: MonthRef, posConfigId: number | undefined) {
  const prev1 = previousMonthOf(anchor);
  const prev2 = previousMonthOf(prev1);

  return {
    anchor: useMonthTicket(anchor, posConfigId),
    prev1: useMonthTicket(prev1, posConfigId),
    prev2: useMonthTicket(prev2, posConfigId),
  };
}
