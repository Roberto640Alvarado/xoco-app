"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { averageTicketOf } from "../types/ticket-diario.types";
import type { DailySalesPoint } from "@/features/sales/types/sales.types";

interface ComparisonRow {
  day: number;
  older: number | null;
  recent: number | null;
}

function mergeByDayIndex(olderPoints: DailySalesPoint[], recentPoints: DailySalesPoint[]): ComparisonRow[] {
  const totalDays = Math.max(olderPoints.length, recentPoints.length);
  return Array.from({ length: totalDays }, (_, index) => ({
    day: index + 1,
    older: olderPoints[index] ? averageTicketOf(olderPoints[index]) : null,
    recent: recentPoints[index] ? averageTicketOf(recentPoints[index]) : null,
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
  payload?: { name?: string; value?: number | null; color?: string; dataKey?: string }[];
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
          {entry.name}: {entry.value != null ? formatCurrency(entry.value) : "sin órdenes"}
        </p>
      ))}
    </div>
  );
}

interface DailyTicketComparisonChartProps {
  title: string;
  olderLabel: string;
  recentLabel: string;
  olderPoints: DailySalesPoint[] | undefined;
  recentPoints: DailySalesPoint[] | undefined;
  isLoading: boolean;
}

// "Comportamiento del ticket promedio [mes ante-anterior] vrs [mes
// anterior]": mismo diseño que DailyTrafficComparisonChart/
// DailySalesComparisonChart — día a día (día 1..31 del mes, no fecha
// real), con la razón venta/órdenes de cada día.
export function DailyTicketComparisonChart({
  title,
  olderLabel,
  recentLabel,
  olderPoints,
  recentPoints,
  isLoading,
}: DailyTicketComparisonChartProps) {
  const rows = mergeByDayIndex(olderPoints ?? [], recentPoints ?? []);
  const hasData = rows.some((row) => (row.older ?? 0) > 0 || (row.recent ?? 0) > 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Ticket promedio por día del mes</p>

      {isLoading ? (
        <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">Cargando...</div>
      ) : !hasData ? (
        <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
          Sin órdenes en los meses comparados.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300} className="mt-2">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
              tickFormatter={(value: number) => formatCurrency(value)}
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              width={56}
            />
            <Tooltip content={<ComparisonTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Legend
              verticalAlign="top"
              align="left"
              height={32}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="older"
              name={olderLabel}
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="recent"
              name={recentLabel}
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
