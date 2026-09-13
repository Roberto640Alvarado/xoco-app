"use client";

import { useMemo, useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { MonthNavigator } from "@/components/filters/month-navigator";
import { StoreSelect } from "@/components/filters/store-select";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { useGoalsSummary } from "@/features/goals/hooks/use-goals-summary";
import { formatInteger, formatPercent } from "@/lib/format";
import {
  currentMonthRef,
  isSameMonth,
  monthLabel as formatMonthLabel,
  monthName,
  nextMonthOf,
  previousMonthOf,
} from "@/lib/month";
import { useDailyTraffic } from "../hooks/use-daily-traffic";
import { useDailyTrafficByStore } from "../hooks/use-daily-traffic-by-store";
import { DailyTrafficComparisonChart } from "./daily-traffic-comparison-chart";
import { DailyTrafficTable } from "./daily-traffic-table";
import { StoreDailyTrafficChart } from "./store-daily-traffic-chart";


// Mismo criterio que TrafficGoalsTable (features/goals/): si falta el dato
// de CUALQUIER tienda, el total no se puede sumar con confianza — mejor
// "—" que un número que parece completo y no lo es.
function sumOrNull(values: Array<number | null>): number | null {
  if (values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

function divideOrNull(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || !denominator) return null;
  return numerator / denominator;
}

// Módulo "Tráfico Diario": tráfico de órdenes día por día. El filtro de mes
// es un solo "mes ancla" (default: mes actual) que mueve las 3 tablas
// (ancla / ancla-1 / ancla-2) y la gráfica de comparación (ancla-1 vs
// ancla-2) juntos. El filtro de tienda aplica a las tablas y a esa
// comparación — la gráfica "por tienda" de abajo siempre muestra todas las
// tiendas (ver plan-history).
export function DailyTrafficView() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentMonthRef(now), [now]);
  const [anchor, setAnchor] = useState(currentMonth);
  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(defaultPosConfigId);

  const { data: stores, isLoading: storesLoading } = useStores();

  const traffic = useDailyTraffic(anchor, posConfigId);
  const byStore = useDailyTrafficByStore(anchor);

  // Meta del mes ancla (mismo dato que alimenta "Tráfico de tiendas" —
  // ver features/goals) — filtrada a la tienda seleccionada, o sumada
  // entre todas si el filtro está en "Todas las tiendas". Se pidió
  // agregarla aquí para no tener que saltar a otra página a ver el avance
  // del mes mientras se revisa el tráfico día a día.
  const goals = useGoalsSummary(anchor.year, anchor.month);
  const monthGoal = useMemo(() => {
    const goalItems = goals.data ?? [];
    if (posConfigId) {
      const item = goalItems.find((g) => g.posConfigId === posConfigId);
      if (!item) return null;
      return { actualOrders: item.actualOrders, targetOrders: item.targetOrders, reachPercent: item.reachPercent };
    }
    if (goalItems.length === 0) return null;
    const actualOrders = goalItems.reduce((sum, item) => sum + item.actualOrders, 0);
    const targetOrders = sumOrNull(goalItems.map((item) => item.targetOrders));
    return { actualOrders, targetOrders, reachPercent: divideOrNull(actualOrders, targetOrders) };
  }, [goals.data, posConfigId]);

  const isNextDisabled = isSameMonth(anchor, currentMonth);

  function goToPreviousMonth() {
    setAnchor((current) => previousMonthOf(current));
  }

  function goToNextMonth() {
    if (isNextDisabled) return;
    setAnchor((current) => nextMonthOf(current));
  }

  const comparisonTitle = `Comportamiento del tráfico ${monthName(traffic.prev2.monthRef)} vrs ${monthName(traffic.prev1.monthRef)}`;

  return (
    <div className="flex flex-col gap-4">
      <FilterToolbar description="Tráfico de órdenes por día — mes seleccionado y los dos meses anteriores.">
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
          filename="trafico-diario"
          disabled={traffic.anchor.isLoading}
          sheets={() => [
            {
              name: traffic.anchor.label,
              rows: (traffic.anchor.data ?? []).map((p) => ({ Fecha: p.date, Órdenes: p.orderCount })),
            },
            {
              name: traffic.prev1.label,
              rows: (traffic.prev1.data ?? []).map((p) => ({ Fecha: p.date, Órdenes: p.orderCount })),
            },
            {
              name: traffic.prev2.label,
              rows: (traffic.prev2.data ?? []).map((p) => ({ Fecha: p.date, Órdenes: p.orderCount })),
            },
          ]}
        />
      </FilterToolbar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Visitas a la fecha (mes ancla)"
          value={formatInteger(monthGoal?.actualOrders ?? 0)}
          isLoading={goals.isLoading}
        />
        <StatTile
          label="Meta del mes"
          value={monthGoal?.targetOrders != null ? formatInteger(monthGoal.targetOrders) : "—"}
          isLoading={goals.isLoading}
        />
        <StatTile
          label="Alcance de meta"
          value={formatPercent(monthGoal?.reachPercent ?? null)}
          isLoading={goals.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DailyTrafficTable
          title={traffic.anchor.label}
          data={traffic.anchor.data}
          isLoading={traffic.anchor.isLoading}
          isError={traffic.anchor.isError}
          errorMessage={traffic.anchor.errorMessage}
        />
        <DailyTrafficTable
          title={traffic.prev1.label}
          data={traffic.prev1.data}
          isLoading={traffic.prev1.isLoading}
          isError={traffic.prev1.isError}
          errorMessage={traffic.prev1.errorMessage}
        />
        <DailyTrafficTable
          title={traffic.prev2.label}
          data={traffic.prev2.data}
          isLoading={traffic.prev2.isLoading}
          isError={traffic.prev2.isError}
          errorMessage={traffic.prev2.errorMessage}
        />
      </div>

      <DailyTrafficComparisonChart
        title={comparisonTitle}
        olderLabel={monthName(traffic.prev2.monthRef)}
        recentLabel={monthName(traffic.prev1.monthRef)}
        olderPoints={traffic.prev2.data}
        recentPoints={traffic.prev1.data}
        isLoading={traffic.prev2.isLoading || traffic.prev1.isLoading}
      />

      <StoreDailyTrafficChart series={byStore.data} isLoading={byStore.isLoading} monthLabel={traffic.anchor.label} />
    </div>
  );
}
