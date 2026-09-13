"use client";

import { useMemo, useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { MonthNavigator } from "@/components/filters/month-navigator";
import { StoreSelect } from "@/components/filters/store-select";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { useSalesGoalsSummary } from "@/features/sales-goals/hooks/use-sales-goals-summary";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  currentMonthRef,
  isSameMonth,
  monthLabel as formatMonthLabel,
  monthName,
  nextMonthOf,
  previousMonthOf,
} from "@/lib/month";
import { useDailySales } from "../hooks/use-daily-sales";
import { useDailySalesByStore } from "../hooks/use-daily-sales-by-store";
import { DailySalesComparisonChart } from "./daily-sales-comparison-chart";
import { DailySalesTable } from "./daily-sales-table";
import { StoreDailySalesChart } from "./store-daily-sales-chart";

// Mismo criterio que DailyTrafficView (features/trafico-diario/): si falta
// el dato de CUALQUIER tienda, el total no se puede sumar con confianza —
// mejor "—" que un número que parece completo y no lo es.
function sumOrNull(values: Array<number | null>): number | null {
  if (values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

function divideOrNull(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || !denominator) return null;
  return numerator / denominator;
}

// Módulo "Venta Diaria": mismo diseño que Tráfico Diario
// (features/trafico-diario/daily-traffic-view.tsx), pero en dólares
// (totalRevenue) en vez de cantidad de órdenes — mismo filtro de mes
// ancla + tienda, mismas 3 tablas, misma gráfica de comparación entre los
// dos meses previos y misma gráfica de comportamiento por tienda del mes
// ancla (siempre todas las tiendas, ver plan-history).
export function DailySalesView() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentMonthRef(now), [now]);
  const [anchor, setAnchor] = useState(currentMonth);
  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(defaultPosConfigId);

  const { data: stores, isLoading: storesLoading } = useStores();

  const sales = useDailySales(anchor, posConfigId);
  const byStore = useDailySalesByStore(anchor);

  // Meta de venta del mes ancla (mismo dato que alimenta "Venta Mensual" —
  // ver features/sales-goals) — filtrada a la tienda seleccionada, o
  // sumada entre todas si el filtro está en "Todas las tiendas". Mismo
  // criterio que el bloque de metas que ya tenía Tráfico Diario, para no
  // tener que saltar a otra página a ver el avance del mes mientras se
  // revisa la venta día a día.
  const salesGoals = useSalesGoalsSummary(anchor.year, anchor.month);
  const monthGoal = useMemo(() => {
    const goalItems = salesGoals.data ?? [];
    if (posConfigId) {
      const item = goalItems.find((g) => g.posConfigId === posConfigId);
      if (!item) return null;
      return { actualRevenue: item.actualRevenue, targetRevenue: item.targetRevenue, reachPercent: item.reachPercent };
    }
    if (goalItems.length === 0) return null;
    const actualRevenue = goalItems.reduce((sum, item) => sum + item.actualRevenue, 0);
    const targetRevenue = sumOrNull(goalItems.map((item) => item.targetRevenue));
    return { actualRevenue, targetRevenue, reachPercent: divideOrNull(actualRevenue, targetRevenue) };
  }, [salesGoals.data, posConfigId]);

  const isNextDisabled = isSameMonth(anchor, currentMonth);

  function goToPreviousMonth() {
    setAnchor((current) => previousMonthOf(current));
  }

  function goToNextMonth() {
    if (isNextDisabled) return;
    setAnchor((current) => nextMonthOf(current));
  }

  const comparisonTitle = `Comportamiento de venta ${monthName(sales.prev2.monthRef)} vrs ${monthName(sales.prev1.monthRef)}`;

  return (
    <div className="flex flex-col gap-4">
      <FilterToolbar description="Venta ($) por día — mes seleccionado y los dos meses anteriores.">
        <MonthNavigator
          label={formatMonthLabel(anchor)}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          nextDisabled={isNextDisabled}
        />
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={setPosConfigId}
          lockedToSingleStore={isVendedor}
        />
        <ExportExcelButton
          filename="venta-diaria-por-mes"
          disabled={sales.anchor.isLoading}
          sheets={() => [
            {
              name: sales.anchor.label,
              rows: (sales.anchor.data ?? []).map((p) => ({ Fecha: p.date, Venta: p.totalRevenue })),
            },
            {
              name: sales.prev1.label,
              rows: (sales.prev1.data ?? []).map((p) => ({ Fecha: p.date, Venta: p.totalRevenue })),
            },
            {
              name: sales.prev2.label,
              rows: (sales.prev2.data ?? []).map((p) => ({ Fecha: p.date, Venta: p.totalRevenue })),
            },
          ]}
        />
      </FilterToolbar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Venta a la fecha (mes ancla)"
          value={formatCurrency(monthGoal?.actualRevenue ?? 0)}
          isLoading={salesGoals.isLoading}
        />
        <StatTile
          label="Meta del mes"
          value={monthGoal?.targetRevenue != null ? formatCurrency(monthGoal.targetRevenue) : "—"}
          isLoading={salesGoals.isLoading}
        />
        <StatTile
          label="Alcance de meta"
          value={formatPercent(monthGoal?.reachPercent ?? null)}
          isLoading={salesGoals.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DailySalesTable
          title={sales.anchor.label}
          data={sales.anchor.data}
          isLoading={sales.anchor.isLoading}
          isError={sales.anchor.isError}
          errorMessage={sales.anchor.errorMessage}
        />
        <DailySalesTable
          title={sales.prev1.label}
          data={sales.prev1.data}
          isLoading={sales.prev1.isLoading}
          isError={sales.prev1.isError}
          errorMessage={sales.prev1.errorMessage}
        />
        <DailySalesTable
          title={sales.prev2.label}
          data={sales.prev2.data}
          isLoading={sales.prev2.isLoading}
          isError={sales.prev2.isError}
          errorMessage={sales.prev2.errorMessage}
        />
      </div>

      <DailySalesComparisonChart
        title={comparisonTitle}
        olderLabel={monthName(sales.prev2.monthRef)}
        recentLabel={monthName(sales.prev1.monthRef)}
        olderPoints={sales.prev2.data}
        recentPoints={sales.prev1.data}
        isLoading={sales.prev2.isLoading || sales.prev1.isLoading}
      />

      <StoreDailySalesChart series={byStore.data} isLoading={byStore.isLoading} monthLabel={sales.anchor.label} />
    </div>
  );
}
