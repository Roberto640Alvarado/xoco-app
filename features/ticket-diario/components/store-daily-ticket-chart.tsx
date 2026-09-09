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
import { formatCurrency, formatLongDate, formatShortDate } from "@/lib/format";
import { averageTicketOf } from "../types/ticket-diario.types";
import type { StoreDailyTicketSeries } from "../types/ticket-diario.types";

const LINE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

interface MergedRow {
  date: string;
  [seriesKey: string]: string | number | null;
}

function seriesKeyFor(posConfigId: number): string {
  return `store_${posConfigId}`;
}

function mergeByDate(series: StoreDailyTicketSeries[]): MergedRow[] {
  const dates = series[0]?.points.map((point) => point.date) ?? [];
  return dates.map((date, index) => {
    const row: MergedRow = { date };
    for (const { store, points } of series) {
      row[seriesKeyFor(store.id)] = points[index] ? averageTicketOf(points[index]) : null;
    }
    return row;
  });
}

// Definido fuera del componente — recharts clona este elemento inyectando
// active/payload/label, mismo motivo que el resto de los tooltips de la
// app (evita react-hooks/static-components).
function MultiStoreTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | null; color?: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{label ? formatLongDate(label) : ""}</p>
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

interface StoreDailyTicketChartProps {
  series: StoreDailyTicketSeries[];
  isLoading: boolean;
  monthLabel: string;
}

// Ticket promedio diario del mes ancla, una línea por tienda — mismo
// diseño que StoreDailyTrafficChart/StoreDailySalesChart, con la razón
// venta/órdenes de cada día. Siempre TODAS las tiendas activas, sin
// importar el filtro de tienda de la página.
export function StoreDailyTicketChart({ series, isLoading, monthLabel }: StoreDailyTicketChartProps) {
  const hasData = series.some((s) => s.points.some((p) => p.orderCount > 0));
  const rows = mergeByDate(series);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">Comportamiento del ticket promedio por tienda</h2>
      <p className="mt-0.5 text-xs capitalize text-muted-foreground">{monthLabel}</p>

      {isLoading ? (
        <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">Cargando...</div>
      ) : !hasData ? (
        <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
          Sin órdenes en el mes seleccionado.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300} className="mt-2">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatShortDate(value)}
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              minTickGap={20}
            />
            <YAxis
              tickFormatter={(value: number) => formatCurrency(value)}
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              width={56}
            />
            <Tooltip content={<MultiStoreTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Legend
              verticalAlign="top"
              align="left"
              height={32}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            {series.map(({ store }, index) => (
              <Line
                key={store.id}
                type="monotone"
                dataKey={seriesKeyFor(store.id)}
                name={store.name}
                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
