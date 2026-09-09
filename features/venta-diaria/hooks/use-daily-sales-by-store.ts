"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary } from "@/features/sales/api/sales.api";
import { useStores } from "@/features/sales/hooks/use-stores";
import { monthDateRange, type MonthRef } from "@/lib/month";
import type { StoreDailyRevenueSeries } from "../types/venta-diaria.types";

// Venta diaria del mes dado, desglosada por CADA tienda activa — para la
// gráfica "comportamiento por tienda". Mismo diseño que
// features/trafico-diario/hooks/use-daily-traffic-by-store.ts: un fetch
// por tienda (mismo /sales/daily-summary), en paralelo.
export function useDailySalesByStore(monthRef: MonthRef) {
  const stores = useStores();
  const { dateFrom, dateTo } = monthDateRange(monthRef);
  const storeIds = stores.data?.map((store) => store.id) ?? [];

  const query = useQuery<StoreDailyRevenueSeries[]>({
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
