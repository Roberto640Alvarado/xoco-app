"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStores } from "@/features/sales/hooks/use-stores";
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

const ALL_STORES = "all";

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
  const [posConfigId, setPosConfigId] = useState<number | undefined>(undefined);

  const { data: stores, isLoading: storesLoading } = useStores();
  const storeValue = posConfigId ? String(posConfigId) : ALL_STORES;

  function storeLabel(value: string): string {
    if (value === ALL_STORES) return "Todas las tiendas";
    const store = stores?.find((s) => String(s.id) === value);
    return store?.name ?? value;
  }

  const sales = useDailySales(anchor, posConfigId);
  const byStore = useDailySalesByStore(anchor);

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
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Venta ($) por día — mes seleccionado y los dos meses anteriores.
        </p>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon-sm" onClick={goToPreviousMonth} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="w-32 text-center text-sm font-medium capitalize text-foreground">
              {formatMonthLabel(anchor)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={goToNextMonth}
              disabled={isNextDisabled}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <Select
            value={storeValue}
            onValueChange={(value) => setPosConfigId(value === ALL_STORES ? undefined : Number(value))}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={storesLoading ? "Cargando..." : "Todas las tiendas"}>
                {(value: string) => (storesLoading ? "Cargando..." : storeLabel(value))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STORES}>Todas las tiendas</SelectItem>
              {stores?.map((store) => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
