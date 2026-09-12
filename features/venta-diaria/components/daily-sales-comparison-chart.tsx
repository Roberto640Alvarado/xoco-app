"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import type { DailySalesPoint } from "@/features/sales/types/sales.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";

interface ComparisonRow {
  day: number;
  older?: number;
  recent?: number;
}

function mergeByDayIndex(olderPoints: DailySalesPoint[], recentPoints: DailySalesPoint[]): ComparisonRow[] {
  const totalDays = Math.max(olderPoints.length, recentPoints.length);
  return Array.from({ length: totalDays }, (_, index) => ({
    day: index + 1,
    older: olderPoints[index]?.totalRevenue,
    recent: recentPoints[index]?.totalRevenue,
  }));
}

// Definido fuera del componente — mismo motivo que el resto de tooltips de
// la app (recharts clona este elemento inyectando active/payload/label).
function ComparisonTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">Día {label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
            aria-hidden="true"
          />
          {entry.name}: {entry.value != null ? formatCurrency(entry.value) : "—"}
        </p>
      ))}
    </div>
  );
}

interface DailySalesComparisonChartProps {
  title: string;
  olderLabel: string;
  recentLabel: string;
  olderPoints: DailySalesPoint[] | undefined;
  recentPoints: DailySalesPoint[] | undefined;
  isLoading: boolean;
}

// "Comportamiento de venta [mes ante-anterior] vrs [mes anterior]": mismo
// diseño que DailyTrafficComparisonChart (features/trafico-diario/), en
// dólares — día a día (día 1..31 del mes, no fecha real, para alinear
// meses de distinta duración).
//
// Barras agrupadas (no líneas): con solo 2 series es la comparación
// "día por día" más directa — mismo radio/paleta que StoreReachChart
// (features/goals/), chart-2 = mes de referencia, chart-1 = mes más
// reciente (ver dataviz skill, tabla "la job -> el tipo": comparar 2
// series por categoría es grouped bar).
export function DailySalesComparisonChart({
  title,
  olderLabel,
  recentLabel,
  olderPoints,
  recentPoints,
  isLoading,
}: DailySalesComparisonChartProps) {
  const rows = mergeByDayIndex(olderPoints ?? [], recentPoints ?? []);
  const hasData = rows.some((row) => (row.older ?? 0) > 0 || (row.recent ?? 0) > 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Venta por día del mes</p>

      {isLoading ? (
        <ChartSkeleton height={288} />
      ) : !hasData ? (
        <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
          Sin venta en los meses comparados.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300} className="mt-2">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="18%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              minTickGap={16}
            />
            <YAxis
              tickFormatter={(value: number) => formatCurrencyCompact(value)}
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              width={56}
            />
            <Tooltip content={<ComparisonTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Legend
              verticalAlign="top"
              align="left"
              height={32}
              iconType="square"
              iconSize={10}
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Bar dataKey="older" name={olderLabel} fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} maxBarSize={12} />
            <Bar dataKey="recent" name={recentLabel} fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} maxBarSize={12} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
