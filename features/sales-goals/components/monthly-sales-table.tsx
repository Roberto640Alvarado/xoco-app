"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { currentMonthRef, monthLabel as formatMonthLabel, monthName, nextMonthOf, previousMonthOf, isSameMonth } from "@/lib/month";
import { useSalesGoalsSummary } from "../hooks/use-sales-goals-summary";
import { SalesGoalPercentModal } from "./sales-goal-percent-modal";
import { SalesReachChart } from "./sales-reach-chart";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { SalesGoalSummaryItem } from "../types/sales-goals.types";

const EMPTY_ITEMS: SalesGoalSummaryItem[] = [];

function sumOrNull(values: Array<number | null>): number | null {
  if (values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

function divideOrNull(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || !denominator) return null;
  return numerator / denominator;
}

interface SalesGoalRowCellsProps {
  item: Pick<SalesGoalSummaryItem, "actualRevenue" | "targetRevenue" | "reachPercent" | "pendingValue">;
}

function SalesGoalRowCells({ item }: SalesGoalRowCellsProps) {
  return (
    <>
      <td className="py-3 pr-4 text-sm text-foreground">{formatCurrency(item.actualRevenue)}</td>
      <td className="py-3 pr-4 text-sm text-foreground">
        {item.targetRevenue != null ? formatCurrency(item.targetRevenue) : "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-foreground">{formatPercent(item.reachPercent)}</td>
      <td className="py-3 text-sm text-foreground">
        {item.pendingValue != null ? formatCurrency(item.pendingValue) : "—"}
      </td>
    </>
  );
}

// Tabla del módulo "Venta Mensual": réplica de la hoja de venta del Excel
// original (ver plan-history) — [Mes] / Meta / Alcance / Valor Pendiente.
// Mismo patrón que TrafficGoalsTable (features/goals/), pero con la meta
// en dólares y su propio % de crecimiento (SalesGoalPercentModal).
export function MonthlySalesTable() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentMonthRef(now), [now]);
  const [anchor, setAnchor] = useState(currentMonth);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const summary = useSalesGoalsSummary(anchor.year, anchor.month);
  const items = summary.data ?? EMPTY_ITEMS;
  const monthColumnLabel = monthName(anchor);

  function goToPreviousMonth() {
    setAnchor((current) => previousMonthOf(current));
  }

  const isNextMonthDisabled = isSameMonth(anchor, currentMonth);

  function goToNextMonth() {
    if (isNextMonthDisabled) return;
    setAnchor((current) => nextMonthOf(current));
  }

  const totals = useMemo(() => {
    const totalActual = items.reduce((sum, item) => sum + item.actualRevenue, 0);
    const totalTarget = sumOrNull(items.map((item) => item.targetRevenue));
    const totalPending = sumOrNull(items.map((item) => item.pendingValue));
    return {
      actualRevenue: totalActual,
      targetRevenue: totalTarget,
      reachPercent: divideOrNull(totalActual, totalTarget),
      pendingValue: totalPending,
    };
  }, [items]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Meta de venta mensual (encadenada sobre el mes anterior), avance y valor pendiente por tienda.
        </p>
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
              disabled={isNextMonthDisabled}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Configurar %
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-normal">Tienda</th>
                <th className="pb-2 pr-4 font-normal">{monthColumnLabel}</th>
                <th className="pb-2 pr-4 font-normal">Meta</th>
                <th className="pb-2 pr-4 font-normal">Alcance</th>
                <th className="pb-2 font-normal">Valor Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {summary.isLoading ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                    Cargando...
                  </td>
                </tr>
              ) : summary.isError ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-destructive">
                    No se pudo cargar la venta mensual{summary.error?.message ? `: ${summary.error.message}` : "."}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                    Sin tiendas activas.
                  </td>
                </tr>
              ) : (
                <>
                  {items.map((item) => (
                    <tr key={item.posConfigId} className="border-b border-border">
                      <td className="py-3 pr-4 text-sm font-medium text-foreground">{item.storeName}</td>
                      <SalesGoalRowCells item={item} />
                    </tr>
                  ))}
                  <tr className="font-semibold text-foreground">
                    <td className="pt-3 pr-4 text-sm">Total Mensual</td>
                    <SalesGoalRowCells item={totals} />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-xs">
        <StatTile
          label="Cumplimiento hasta la fecha"
          value={formatPercent(totals.reachPercent)}
          isLoading={summary.isLoading}
        />
      </div>

      <SalesReachChart items={items} isLoading={summary.isLoading} emptyLabel="Sin tiendas activas." />

      <SalesGoalPercentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        year={anchor.year}
        month={anchor.month}
        monthLabel={formatMonthLabel(anchor)}
        items={items}
      />
    </div>
  );
}
