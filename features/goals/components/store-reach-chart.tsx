"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatInteger } from "@/lib/format";
import type { GoalSummaryItem } from "../types/goals.types";

// Definido fuera del componente (no como factory en cada render) — mismo
// motivo que TrendTooltip en daily-trend-chart.tsx: evita
// react-hooks/static-components ("Cannot create components during
// render"), recharts clona este elemento inyectando active/payload.
function ReachTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: GoalSummaryItem }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{item.storeName}</p>
      <p className="mt-0.5 text-muted-foreground">Visitas a la fecha: {formatInteger(item.actualOrders)}</p>
      <p className="text-muted-foreground">
        Meta del mes: {item.targetOrders != null ? formatInteger(item.targetOrders) : "sin definir"}
      </p>
    </div>
  );
}

function barLabelFormatter(value: unknown) {
  return typeof value === "number" ? formatInteger(value) : "";
}

interface StoreReachChartProps {
  items: GoalSummaryItem[];
  isLoading: boolean;
  emptyLabel: string;
}

// Réplica del gráfico "Alcance de meta por tienda" del Excel original:
// barras agrupadas por tienda, Visitas a la fecha (azul, el acento de
// dataviz de la app) vs. Meta del mes (gris) — mismos dos colores que ya
// usa el resto del dashboard para "dato real" vs. "referencia".
export function StoreReachChart({ items, isLoading, emptyLabel }: StoreReachChartProps) {
  const hasData = items.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">Alcance de meta por tienda</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Visitas a la fecha vs. meta del mes</p>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando...</div>
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
      ) : (
        <ResponsiveContainer width="100%" height={280} className="mt-2">
          <BarChart data={items} margin={{ top: 24, right: 8, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="storeName"
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis hide />
            <Tooltip content={<ReachTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Legend
              verticalAlign="top"
              align="left"
              height={32}
              iconType="square"
              iconSize={10}
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Bar
              dataKey="actualOrders"
              name="Visitas a la fecha"
              fill="var(--color-chart-1)"
              radius={[3, 3, 0, 0]}
              maxBarSize={44}
              label={{ position: "top", fill: "var(--muted-foreground)", fontSize: 11, formatter: barLabelFormatter }}
            />
            <Bar
              dataKey="targetOrders"
              name="Meta del mes"
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
