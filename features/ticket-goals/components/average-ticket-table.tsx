"use client";

import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { MonthNavigator } from "@/components/filters/month-navigator";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { currentMonthRef, monthLabel as formatMonthLabel, monthName, nextMonthOf, previousMonthOf, isSameMonth } from "@/lib/month";
import { useTicketGoalsSummary } from "../hooks/use-ticket-goals-summary";
import { TicketGoalPercentModal } from "./ticket-goal-percent-modal";
import { TicketReachChart } from "./ticket-reach-chart";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { TicketGoalSummaryItem } from "../types/ticket-goals.types";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";

const EMPTY_ITEMS: TicketGoalSummaryItem[] = [];

// A diferencia de Tráfico de tiendas/Venta Mensual (donde la fila total
// SUMA las tiendas), el ticket promedio no tiene sentido sumado — la fila
// de cierre acá es un PROMEDIO simple entre tiendas (así lo tiene también
// el Excel original: "Promedio", no "Total").
function averageOrNull(values: Array<number | null>): number | null {
  if (values.length === 0 || values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0) / values.length;
}

interface TicketRowCellsProps {
  item: Pick<TicketGoalSummaryItem, "actualAverageTicket" | "targetAverageTicket" | "difference">;
}

function TicketRowCells({ item }: TicketRowCellsProps) {
  return (
    <>
      <td className="py-3 pr-4 text-sm text-foreground">{formatCurrency(item.actualAverageTicket)}</td>
      <td className="py-3 pr-4 text-sm text-foreground">
        {item.targetAverageTicket != null ? formatCurrency(item.targetAverageTicket) : "—"}
      </td>
      <td
        className={cn(
          "py-3 text-sm",
          item.difference != null && item.difference < 0 ? "text-destructive" : "text-foreground",
        )}
      >
        {item.difference != null ? formatCurrency(item.difference) : "—"}
      </td>
    </>
  );
}

// Tabla del módulo "Ticket Promedio": réplica de la hoja del Excel
// original (ver plan-history) — Tienda / [Mes] / Meta / Diferencia, fila
// "Promedio" al final. Mismo patrón de toolbar/navegador de mes que
// MonthlySalesTable (features/sales-goals/), con su propio modal de %.
export function AverageTicketTable() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentMonthRef(now), [now]);
  const [anchor, setAnchor] = useState(currentMonth);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const summary = useTicketGoalsSummary(anchor.year, anchor.month);
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
    const avgActual = averageOrNull(items.map((item) => item.actualAverageTicket)) ?? 0;
    const avgTarget = averageOrNull(items.map((item) => item.targetAverageTicket));
    const avgDifference = averageOrNull(items.map((item) => item.difference));
    const avgReach = averageOrNull(items.map((item) => item.reachPercent));
    return {
      actualAverageTicket: avgActual,
      targetAverageTicket: avgTarget,
      difference: avgDifference,
      reachPercent: avgReach,
    };
  }, [items]);

  return (
    <div className="flex flex-col gap-4">
      <FilterToolbar description="Meta de ticket promedio del mes, encadenada sobre el mes anterior — real y diferencia por tienda.">
        <MonthNavigator
          label={formatMonthLabel(anchor)}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          nextDisabled={isNextMonthDisabled}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          Configurar %
        </Button>
        <ExportExcelButton
          filename="ticket-promedio"
          disabled={summary.isLoading || items.length === 0}
          sheets={() => [
            {
              name: "Ticket promedio",
              rows: [
                ...items.map((item) => ({
                  Tienda: item.storeName,
                  [monthColumnLabel]: item.actualAverageTicket,
                  Meta: item.targetAverageTicket,
                  Diferencia: item.difference,
                })),
                {
                  Tienda: "Promedio",
                  [monthColumnLabel]: totals.actualAverageTicket,
                  Meta: totals.targetAverageTicket,
                  Diferencia: totals.difference,
                },
              ],
            },
          ]}
        />
      </FilterToolbar>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-normal">Tienda</th>
                <th className="pb-2 pr-4 font-normal">{monthColumnLabel}</th>
                <th className="pb-2 pr-4 font-normal">Meta</th>
                <th className="pb-2 font-normal">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {summary.isLoading ? (
                <TableSkeletonRows rows={4} columns={4} />
              ) : summary.isError ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-destructive">
                    No se pudo cargar el ticket promedio{summary.error?.message ? `: ${summary.error.message}` : "."}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                    Sin tiendas activas.
                  </td>
                </tr>
              ) : (
                <>
                  {items.map((item) => (
                    <tr key={item.posConfigId} className="border-b border-border">
                      <td className="py-3 pr-4 text-sm font-medium text-foreground">{item.storeName}</td>
                      <TicketRowCells item={item} />
                    </tr>
                  ))}
                  <tr className="font-semibold text-foreground">
                    <td className="pt-3 pr-4 text-sm">Promedio</td>
                    <TicketRowCells item={totals} />
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

      <TicketReachChart items={items} isLoading={summary.isLoading} emptyLabel="Sin tiendas activas." />

      <TicketGoalPercentModal
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
