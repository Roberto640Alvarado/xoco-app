"use client";

import { useMemo, useState } from "react";
import { SalesFiltersBar } from "@/features/sales/components/sales-filters";
import { StatTile } from "@/components/ui/stat-tile";
import { DailyTrendChart } from "@/components/charts/daily-trend-chart";
import { useDailySummary } from "@/features/sales/hooks/use-daily-summary";
import { formatInteger, isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import type { SalesFilters } from "@/features/sales/types/sales.types";

// Visitas se mide por la cantidad de órdenes de la tienda (ver plan-history) —
// reutiliza la misma serie de /sales/daily-summary que Ventas, cambiando solo
// el metricKey a orderCount.
export default function VisitasPage() {
  const [filters, setFilters] = useState<SalesFilters>({
    dateFrom: isoDateDaysAgo(29),
    dateTo: todayIsoDate(),
  });

  const dailySummary = useDailySummary(filters);
  const data = dailySummary.data ?? [];

  const totals = useMemo(() => {
    const points = dailySummary.data ?? [];
    const totalOrders = points.reduce((sum, point) => sum + point.orderCount, 0);
    const daysWithData = points.length;
    const averageOrders = daysWithData > 0 ? totalOrders / daysWithData : 0;
    return { totalOrders, averageOrders };
  }, [dailySummary.data]);

  return (
    <div className="flex flex-col gap-6">
      <SalesFiltersBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label="Visitas totales"
          value={formatInteger(totals.totalOrders)}
          isLoading={dailySummary.isLoading}
          isError={dailySummary.isError}
        />
        <StatTile
          label="Órdenes promedio por día"
          value={formatInteger(totals.averageOrders)}
          isLoading={dailySummary.isLoading}
          isError={dailySummary.isError}
        />
      </div>

      <DailyTrendChart
        data={data}
        isLoading={dailySummary.isLoading}
        errorMessage={dailySummary.error?.message}
        title="Visitas por día"
        subtitle="Cantidad de órdenes"
        metricKey="orderCount"
        formatValue={formatInteger}
        emptyLabel="Sin visitas en el rango seleccionado"
        tableValueLabel="Órdenes"
      />
    </div>
  );
}
