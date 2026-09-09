"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary } from "@/features/sales/api/sales.api";
import { useStores } from "@/features/sales/hooks/use-stores";
import { monthDateRange, type MonthRef } from "@/lib/month";
import type { StoreDailyTicketSeries } from "../types/ticket-diario.types";

// Venta + órdenes diarias del mes dado, desglosadas por CADA tienda
// activa — para la gráfica "comportamiento por tienda" (ticket promedio).
// Mismo diseño que features/trafico-diario/hooks/use-daily-traffic-by-store.ts:
// un fetch por tienda, en paralelo.
export function useDailyTicketByStore(monthRef: MonthRef) {
  const stores = useStores();
  const { dateFrom, dateTo } = monthDateRange(monthRef);
  const storeIds = stores.data?.map((store) => store.id) ?? [];

  const query = useQuery<StoreDailyTicketSeries[]>({
    queryKey: ["sales", "daily-summary-by-store", { dateFrom, dateTo, storeIds }],
    queryFn: async () => {
      const activeStores = stores.data ?? [];
      return Promise.all(
        activeStores.map(async (store) => ({
          store,
          points: await fetchDailySummary({ dateFrom, dateTo, posConfigId: store.id }),
        })),
      );
    },
    enabled: stores.isSuccess && storeIds.length > 0,
  });

  return {
    data: query.data ?? [],
    isLoading: stores.isLoading || (stores.isSuccess && query.isLoading),
    isError: stores.isError || query.isError,
  };
}
