"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary } from "@/features/sales/api/sales.api";
import { useStores } from "@/features/sales/hooks/use-stores";
import { monthDateRange, type MonthRef } from "@/lib/month";
import type { StoreDailySeries } from "../types/trafico-diario.types";

// Tráfico diario del mes dado, desglosado por CADA tienda activa — para la
// gráfica "comportamiento por tienda". Un fetch por tienda (mismo
// /sales/daily-summary de siempre, con posConfigId), en paralelo; no hay
// endpoint agregado por tienda en el backend, y con ~4 tiendas esto es
// equivalente en costo a lo que ya hace GoalsService.getSummary().
export function useDailyTrafficByStore(monthRef: MonthRef) {
  const stores = useStores();
  const { dateFrom, dateTo } = monthDateRange(monthRef);
  const storeIds = stores.data?.map((store) => store.id) ?? [];

  const query = useQuery<StoreDailySeries[]>({
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
