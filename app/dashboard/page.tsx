"use client";

import { useMemo, useState } from "react";
import { SalesFiltersBar } from "@/features/sales/components/sales-filters";
import { StatTile } from "@/components/ui/stat-tile";
import { DailyTrendChart } from "@/components/charts/daily-trend-chart";
import { useDailySummary } from "@/features/sales/hooks/use-daily-summary";
import { formatCurrency, isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import type { SalesFilters } from "@/features/sales/types/sales.types";

export default function DashboardPage() {
  const [filters, setFilters] = useState<SalesFilters>({
    dateFrom: isoDateDaysAgo(29),
    dateTo: todayIsoDate(),
  });

  const dailySummary = useDailySummary(filters);
  const data = dailySummary.data ?? [];

  const totals = useMemo(() => {
    const points = dailySummary.data ?? [];
    const totalRevenue = points.reduce((sum, point) => sum + point.totalRevenue, 0);
    const totalTax = points.reduce((sum, point) => sum + point.totalTax, 0);
    const totalOrders = points.reduce((sum, point) => sum + point.orderCount, 0);
    const netRevenue = totalRevenue - totalTax;
    const averageSale = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalTax, netRevenue, averageSale };
  }, [dailySummary.data]);

  return (
    <div className="flex flex-col gap-6">
      <SalesFiltersBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Ingresos totales"
          value={formatCurrency(totals.totalRevenue)}
          isLoading={dailySummary.isLoading}
          isError={dailySummary.isError}
        />
        <StatTile
          label="Impuestos (IVA)"
          value={formatCurrency(totals.totalTax)}
          isLoading={dailySummary.isLoading}
          isError={dailySummary.isError}
        />
        <StatTile
          label="Ingresos netos"
          value={formatCurrency(totals.netRevenue)}
          isLoading={dailySummary.isLoading}
          isError={dailySummary.isError}
        />
        <StatTile
          label="Venta promedio"
          value={formatCurrency(totals.averageSale)}
          isLoading={dailySummary.isLoading}
          isError={dailySummary.isError}
        />
      </div>

      <DailyTrendChart
        data={data}
        isLoading={dailySummary.isLoading}
        errorMessage={dailySummary.error?.message}
        title="Ventas por día"
        subtitle="Ingresos brutos"
        metricKey="totalRevenue"
        formatValue={formatCurrency}
        emptyLabel="Sin ventas en el rango seleccionado"
        tableValueLabel="Ingresos"
      />
    </div>
  );
}
