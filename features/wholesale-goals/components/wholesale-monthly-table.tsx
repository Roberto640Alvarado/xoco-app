"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import {
  currentMonthRef,
  daysInMonthOf,
  monthLabel as formatMonthLabel,
  monthName,
  nextMonthOf,
  previousMonthOf,
  isSameMonth,
  type MonthRef,
} from "@/lib/month";
import { useWholesaleGoalsSummary } from "../hooks/use-wholesale-goals-summary";
import { useWholesaleClientTotals } from "../hooks/use-wholesale-client-totals";
import { WholesaleGoalPercentModal } from "./wholesale-goal-percent-modal";
import { WholesaleReachChart } from "./wholesale-reach-chart";
import { WholesaleBuyersTable } from "./wholesale-buyers-table";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { WholesaleGoalSummaryItem } from "../types/wholesale-goals.types";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";

const EMPTY_ITEMS: WholesaleGoalSummaryItem[] = [];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function sumOrNull(values: Array<number | null>): number | null {
  if (values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

function divideOrNull(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || !denominator) return null;
  return numerator / denominator;
}

// Mismo rango que usa el backend para "actualRevenue" (ver
// WholesaleGoalsService.getSummary, "hasta ayer" en el mes en curso) — se
// replica acá para que el desglose por comprador de abajo muestre
// EXACTAMENTE el mismo período que la tabla de Meta, y los totales
// cuadren entre ambas secciones. `null` cuando el mes en curso apenas
// empezó (hoy es el día 1: no hay "ayer" dentro de este mes todavía).
function actualRevenueDateRange(anchor: MonthRef, now: Date): { dateFrom: string; dateTo: string } | null {
  const dateFrom = `${anchor.year}-${pad2(anchor.month)}-01`;
  if (!isSameMonth(anchor, currentMonthRef(now))) {
    const lastDay = daysInMonthOf(anchor);
    return { dateFrom, dateTo: `${anchor.year}-${pad2(anchor.month)}-${pad2(lastDay)}` };
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (yesterday.getMonth() + 1 !== anchor.month || yesterday.getFullYear() !== anchor.year) return null;
  return { dateFrom, dateTo: `${anchor.year}-${pad2(anchor.month)}-${pad2(yesterday.getDate())}` };
}

interface WholesaleGoalRowCellsProps {
  item: Pick<WholesaleGoalSummaryItem, "actualRevenue" | "targetRevenue" | "reachPercent" | "pendingValue">;
}

function WholesaleGoalRowCells({ item }: WholesaleGoalRowCellsProps) {
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

// Tabla del módulo "Ventas Mayoreo": mismo patrón que MonthlySalesTable
// (features/sales-goals/, "Venta Mensual"), pero por cliente de mayoreo
// fijo (Selectos, Operadora del Sur) en vez de por tienda — se pidió como
// módulo aparte porque son cuentas que facturan sin pasar por caja, no
// tiendas físicas. Agrega abajo el desglose "por comprador" que no tiene
// sentido en Venta Mensual (una tienda no tiene "compradores").
export function WholesaleMonthlyTable() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentMonthRef(now), [now]);
  const [anchor, setAnchor] = useState(currentMonth);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const summary = useWholesaleGoalsSummary(anchor.year, anchor.month);
  const items = summary.data ?? EMPTY_ITEMS;
  const monthColumnLabel = monthName(anchor);

  const buyersRange = useMemo(() => actualRevenueDateRange(anchor, now), [anchor, now]);
  const buyerTotals = useWholesaleClientTotals(buyersRange?.dateFrom ?? null, buyersRange?.dateTo ?? null);
  const buyerItems = buyerTotals.data?.items ?? [];

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
          Meta de venta mensual (encadenada sobre el mes anterior), avance y valor pendiente por cliente de mayoreo.
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
                <th className="pb-2 pr-4 font-normal">Cliente</th>
                <th className="pb-2 pr-4 font-normal">{monthColumnLabel}</th>
                <th className="pb-2 pr-4 font-normal">Meta</th>
                <th className="pb-2 pr-4 font-normal">Alcance</th>
                <th className="pb-2 font-normal">Valor Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {summary.isLoading ? (
                <TableSkeletonRows rows={2} columns={5} />
              ) : summary.isError ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-destructive">
                    No se pudo cargar Ventas Mayoreo{summary.error?.message ? `: ${summary.error.message}` : "."}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                    Sin clientes de mayoreo configurados.
                  </td>
                </tr>
              ) : (
                <>
                  {items.map((item) => (
                    <tr key={item.clientKey} className="border-b border-border">
                      <td className="py-3 pr-4 text-sm font-medium text-foreground">{item.clientLabel}</td>
                      <WholesaleGoalRowCells item={item} />
                    </tr>
                  ))}
                  <tr className="font-semibold text-foreground">
                    <td className="pt-3 pr-4 text-sm">Total Mayoreo</td>
                    <WholesaleGoalRowCells item={totals} />
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

      <WholesaleReachChart items={items} isLoading={summary.isLoading} emptyLabel="Sin clientes de mayoreo configurados." />

      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">Por comprador</h2>
          <p className="text-xs text-muted-foreground">
            Desglose de {monthColumnLabel.toLowerCase()} por sucursal/comprador dentro de cada cliente — mismo
            período que la tabla de arriba.
          </p>
        </div>
        {buyersRange == null ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
            Todavía no hay un día completo que mostrar en {monthColumnLabel.toLowerCase()}.
          </div>
        ) : (
          <WholesaleBuyersTable clients={buyerItems} isLoading={buyerTotals.isLoading} />
        )}
      </div>

      <WholesaleGoalPercentModal
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
