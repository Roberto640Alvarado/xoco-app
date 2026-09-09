"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { useGoalsSummary } from "../hooks/use-goals-summary";
import { GrowthPercentModal } from "./growth-percent-modal";
import { StoreReachChart } from "./store-reach-chart";
import { formatInteger, formatPercent } from "@/lib/format";
import type { GoalSummaryItem } from "../types/goals.types";

const MONTH_LABELS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Encabezados EXACTOS pedidos por el usuario (misma terminología que la
// hoja "Trafico de tiendas " del Excel original) — no renombrar.
const EMPTY_ITEMS: GoalSummaryItem[] = [];

const COLUMNS = [
  "Visitas a la fecha",
  "Meta del mes",
  "Alcance",
  "Visitas faltantes a la fecha",
  "Visitas Diarias Necesarias",
  "Proyección cierre de mes",
  "%",
] as const;

function sumOrNull(values: Array<number | null>): number | null {
  if (values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

function divideOrNull(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || !denominator) return null;
  return numerator / denominator;
}

interface GoalRowCellsProps {
  item: Pick<
    GoalSummaryItem,
    "actualOrders" | "targetOrders" | "reachPercent" | "missingOrders" | "dailyNeededOrders" | "projectedOrders" | "projectedReachPercent"
  >;
}

function GoalRowCells({ item }: GoalRowCellsProps) {
  return (
    <>
      <td className="py-3 pr-4 text-sm text-foreground">{formatInteger(item.actualOrders)}</td>
      <td className="py-3 pr-4 text-sm text-foreground">
        {item.targetOrders != null ? formatInteger(item.targetOrders) : "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-foreground">{formatPercent(item.reachPercent)}</td>
      <td className="py-3 pr-4 text-sm text-foreground">
        {item.missingOrders != null ? formatInteger(item.missingOrders) : "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-foreground">
        {item.dailyNeededOrders != null ? formatInteger(item.dailyNeededOrders) : "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-foreground">{formatInteger(item.projectedOrders)}</td>
      <td className="py-3 text-sm text-foreground">{formatPercent(item.projectedReachPercent)}</td>
    </>
  );
}

// Tabla del módulo "Tráfico de tiendas": replica la hoja "Trafico de
// tiendas " del Excel original (ver plan-history). "Meta del mes" se
// deriva del total real del mes anterior + un % de crecimiento que se
// configura desde el modal (GrowthPercentModal) — nunca se captura como
// número fijo.
export function TrafficGoalsTable() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [isModalOpen, setIsModalOpen] = useState(false);

  const summary = useGoalsSummary(year, month);
  const items = summary.data ?? EMPTY_ITEMS;
  const monthLabel = `${MONTH_LABELS[month - 1]} ${year}`;

  function goToPreviousMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  const isNextMonthDisabled =
    year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

  function goToNextMonth() {
    if (isNextMonthDisabled) return;
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const totals = useMemo(() => {
    const totalActual = items.reduce((sum, item) => sum + item.actualOrders, 0);
    const totalTarget = sumOrNull(items.map((item) => item.targetOrders));
    const totalMissing = sumOrNull(items.map((item) => item.missingOrders));
    const totalProjected = items.reduce((sum, item) => sum + item.projectedOrders, 0);
    return {
      actualOrders: totalActual,
      targetOrders: totalTarget,
      reachPercent: divideOrNull(totalActual, totalTarget),
      missingOrders: totalMissing,
      dailyNeededOrders: totalMissing,
      projectedOrders: totalProjected,
      projectedReachPercent: divideOrNull(totalProjected, totalTarget),
    };
  }, [items]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Meta mensual (sobre el mes anterior real), avance y proyección de cierre por tienda.
        </p>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon-sm" onClick={goToPreviousMonth} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="w-32 text-center text-sm font-medium text-foreground capitalize">{monthLabel}</span>
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
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-normal">Tienda</th>
                {COLUMNS.map((col) => (
                  <th key={col} className="pb-2 pr-4 font-normal last:pr-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.isLoading ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-4 text-center text-sm text-muted-foreground">
                    Cargando...
                  </td>
                </tr>
              ) : summary.isError ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-4 text-center text-sm text-destructive">
                    No se pudo cargar el tráfico de tiendas{summary.error?.message ? `: ${summary.error.message}` : "."}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-4 text-center text-sm text-muted-foreground">
                    Sin tiendas activas.
                  </td>
                </tr>
              ) : (
                <>
                  {items.map((item) => (
                    <tr key={item.posConfigId} className="border-b border-border">
                      <td className="py-3 pr-4 text-sm font-medium text-foreground">{item.storeName}</td>
                      <GoalRowCells item={item} />
                    </tr>
                  ))}
                  <tr className="font-semibold text-foreground">
                    <td className="pt-3 pr-4 text-sm">Total Mensual</td>
                    <GoalRowCells item={totals} />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-xs">
        <StatTile
          label="Cumplimiento de meta a la fecha"
          value={formatPercent(totals.reachPercent)}
          isLoading={summary.isLoading}
        />
      </div>

      <StoreReachChart
        items={items}
        isLoading={summary.isLoading}
        emptyLabel="Sin tiendas activas."
      />

      <GrowthPercentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        year={year}
        month={month}
        monthLabel={monthLabel}
        items={items}
      />
    </div>
  );
}
