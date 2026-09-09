"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { TicketGoalSummaryItem } from "../types/ticket-goals.types";

// Definido fuera del componente — mismo motivo que el resto de tooltips
// de la app (recharts clona este elemento inyectando active/payload).
function TicketReachTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TicketGoalSummaryItem }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{item.storeName}</p>
      <p className="mt-0.5 text-muted-foreground">Ticket a la fecha: {formatCurrency(item.actualAverageTicket)}</p>
      <p className="text-muted-foreground">
        Meta: {item.targetAverageTicket != null ? formatCurrency(item.targetAverageTicket) : "sin definir"}
      </p>
    </div>
  );
}

function barLabelFormatter(value: unknown) {
  return typeof value === "number" ? formatCurrency(value) : "";
}

interface TicketReachChartProps {
  items: TicketGoalSummaryItem[];
  isLoading: boolean;
  emptyLabel: string;
}

// Mismo patrón que StoreReachChart/SalesReachChart — barras agrupadas por
// tienda, ticket promedio real vs. meta, en dólares.
export function TicketReachChart({ items, isLoading, emptyLabel }: TicketReachChartProps) {
  const hasData = items.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">Alcance de meta de ticket promedio por tienda</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Ticket promedio a la fecha vs. meta del mes</p>

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
            <Tooltip content={<TicketReachTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Legend
              verticalAlign="top"
              align="left"
              height={32}
              iconType="square"
              iconSize={10}
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            <Bar
              dataKey="actualAverageTicket"
              name="Ticket a la fecha"
              fill="var(--color-chart-1)"
              radius={[3, 3, 0, 0]}
              maxBarSize={44}
              label={{ position: "top", fill: "var(--muted-foreground)", fontSize: 11, formatter: barLabelFormatter }}
            />
            <Bar
              dataKey="targetAverageTicket"
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
