"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrencyCompact, formatCurrency } from "@/lib/format";
import type { WholesaleGoalSummaryItem } from "../types/wholesale-goals.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";

// Definido fuera del componente — mismo motivo que SalesReachTooltip
// (features/sales-goals/): recharts clona este elemento inyectando
// active/payload.
function WholesaleReachTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: WholesaleGoalSummaryItem }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{item.clientLabel}</p>
      <p className="mt-0.5 text-muted-foreground">Venta a la fecha: {formatCurrency(item.actualRevenue)}</p>
      <p className="text-muted-foreground">
        Meta: {item.targetRevenue != null ? formatCurrency(item.targetRevenue) : "sin definir"}
      </p>
    </div>
  );
}

function barLabelFormatter(value: unknown) {
  return typeof value === "number" ? formatCurrencyCompact(value) : "";
}

interface WholesaleReachChartProps {
  items: WholesaleGoalSummaryItem[];
  isLoading: boolean;
  emptyLabel: string;
}

// Mismo patrón que SalesReachChart (features/sales-goals/) — barras
// agrupadas por cliente de mayoreo, venta real vs. meta, en dólares.
export function WholesaleReachChart({ items, isLoading, emptyLabel }: WholesaleReachChartProps) {
  const hasData = items.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">Alcance de meta por cliente de mayoreo</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Venta a la fecha vs. meta del mes</p>

      {isLoading ? (
        <ChartSkeleton height={256} />
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
      ) : (
        <ResponsiveContainer width="100%" height={280} className="mt-2">
          <BarChart data={items} margin={{ top: 24, right: 8, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="clientLabel"
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis hide />
            <Tooltip content={<WholesaleReachTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Legend
              verticalAlign="top"
              align="left"
              height={32}
              iconType="square"
              iconSize={10}
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Bar
              dataKey="actualRevenue"
              name="Venta a la fecha"
              fill="var(--color-chart-1)"
              radius={[3, 3, 0, 0]}
              maxBarSize={44}
              label={{ position: "top", fill: "var(--muted-foreground)", fontSize: 11, formatter: barLabelFormatter }}
            />
            <Bar
              dataKey="targetRevenue"
              name="Meta"
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
