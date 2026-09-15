"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import type { WholesaleGoalSummaryItem } from "../types/wholesale-goals.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { ChartErrorState } from "@/components/ui/chart-error-state";

interface ComparisonRow {
  clientKey: string;
  clientLabel: string;
  current: number;
  previous: number;
}

function mergeByClient(
  currentItems: WholesaleGoalSummaryItem[],
  previousItems: WholesaleGoalSummaryItem[]
): ComparisonRow[] {
  const previousByKey = new Map(previousItems.map((item) => [item.clientKey, item.actualRevenue]));
  return currentItems.map((item) => ({
    clientKey: item.clientKey,
    clientLabel: item.clientLabel,
    current: item.actualRevenue,
    previous: previousByKey.get(item.clientKey) ?? 0,
  }));
}

// Definido fuera del componente — mismo motivo que WholesaleReachTooltip
// (recharts clona este elemento inyectando active/payload).
function ComparisonTooltip({
  active,
  payload,
  currentLabel,
  previousLabel,
}: {
  active?: boolean;
  payload?: { payload: ComparisonRow }[];
  currentLabel: string;
  previousLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{row.clientLabel}</p>
      <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: "var(--color-chart-1)" }}
          aria-hidden="true"
        />
        {currentLabel}: {formatCurrency(row.current)}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: "var(--color-chart-2)" }}
          aria-hidden="true"
        />
        {previousLabel}: {formatCurrency(row.previous)}
      </p>
    </div>
  );
}

function barLabelFormatter(value: unknown) {
  return typeof value === "number" ? formatCurrencyCompact(value) : "";
}

interface WholesaleMonthComparisonChartProps {
  currentItems: WholesaleGoalSummaryItem[];
  previousItems: WholesaleGoalSummaryItem[];
  currentLabel: string;
  previousLabel: string;
  isLoading: boolean;
  errorMessage?: string | null;
  emptyLabel: string;
}

// Comparación "mes seleccionado (navegado con MonthNavigator) vs. mes
// anterior" por cliente de mayoreo (Selectos, Operadora del Sur) — mismo
// patrón de barras agrupadas que DailySalesComparisonChart
// (features/venta-diaria/): chart-1 = mes seleccionado, chart-2 = mes de
// referencia. Reusa /wholesale-goals/summary para ambos meses (mismo
// endpoint que ya alimenta la tabla de arriba), así "venta a la fecha"
// del mes en curso se compara contra el total completo del mes anterior
// con exactamente la misma definición de actualRevenue que el resto del
// módulo (ver WholesaleGoalsService.getSummary).
export function WholesaleMonthComparisonChart({
  currentItems,
  previousItems,
  currentLabel,
  previousLabel,
  isLoading,
  errorMessage,
  emptyLabel,
}: WholesaleMonthComparisonChartProps) {
  const data = mergeByClient(currentItems, previousItems);
  const hasData = data.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">Comparativo por cliente de mayoreo</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {currentLabel} vs. {previousLabel}
      </p>

      {isLoading ? (
        <ChartSkeleton height={256} />
      ) : errorMessage ? (
        <ChartErrorState message={errorMessage} />
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
      ) : (
        <ResponsiveContainer width="100%" height={280} className="mt-2">
          <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="clientLabel"
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis hide />
            <Tooltip
              content={<ComparisonTooltip currentLabel={currentLabel} previousLabel={previousLabel} />}
              cursor={{ fill: "var(--muted)" }}
            />
            <Legend
              verticalAlign="top"
              align="left"
              height={32}
              iconType="square"
              iconSize={10}
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Bar
              dataKey="current"
              name={currentLabel}
              fill="var(--color-chart-1)"
              radius={[3, 3, 0, 0]}
              maxBarSize={44}
              label={{ position: "top", fill: "var(--muted-foreground)", fontSize: 11, formatter: barLabelFormatter }}
            />
            <Bar
              dataKey="previous"
              name={previousLabel}
              fill="var(--color-chart-2)"
              radius={[3, 3, 0, 0]}
              maxBarSize={44}
              label={{ position: "top", fill: "var(--muted-foreground)", fontSize: 11, formatter: barLabelFormatter }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
