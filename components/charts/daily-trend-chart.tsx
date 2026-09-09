"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLongDate, formatShortDate } from "@/lib/format";
import type { DailySalesPoint } from "@/features/sales/types/sales.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";

interface DailyTrendChartProps {
  data: DailySalesPoint[];
  isLoading: boolean;
  title: string;
  subtitle: string;
  metricKey: "totalRevenue" | "orderCount" | "totalTax";
  formatValue: (value: number) => string;
  formatAxisValue?: (value: number) => string;
  emptyLabel: string;
  tableValueLabel: string;
}

// Definido fuera de DailyTrendChart (no como factory que retorna un
// componente en cada render) para no disparar react-hooks/static-components
// ("Cannot create components during render") — recharts clona este elemento
// inyectándole `active`/`payload`, así que metricKey/formatValue se pasan
// como props normales en vez de por closure.
function TrendTooltip({
  active,
  payload,
  metricKey,
  formatValue,
}: {
  active?: boolean;
  payload?: { payload: DailySalesPoint }[];
  metricKey: DailyTrendChartProps["metricKey"];
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{formatLongDate(point.date)}</p>
      <p className="mt-0.5 text-muted-foreground">{formatValue(point[metricKey])}</p>
    </div>
  );
}

// Gráfica de tendencia diaria genérica — sirve tanto para "ventas por día"
// (metricKey="totalRevenue") como para "visitas por día" (metricKey=
// "orderCount"), reutilizando la misma serie de /sales/daily-summary. Serie
// única: sin caja de leyenda (ver dataviz skill), un solo color de acento.
export function DailyTrendChart({
  data,
  isLoading,
  title,
  subtitle,
  metricKey,
  formatValue,
  formatAxisValue = formatValue,
  emptyLabel,
  tableValueLabel,
}: DailyTrendChartProps) {
  const hasData = data.some((point) => point[metricKey] > 0);
  const gradientId = `trend-fill-${metricKey}`;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>

      {isLoading ? (
        <ChartSkeleton height={256} />
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={formatAxisValue}
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              width={64}
            />
            <Tooltip
              content={<TrendTooltip metricKey={metricKey} formatValue={formatValue} />}
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey={metricKey}
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {hasData && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Ver tabla
          </summary>
          <div className="mt-2 max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>{tableValueLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((point) => (
                  <TableRow key={point.date}>
                    <TableCell>{formatLongDate(point.date)}</TableCell>
                    <TableCell>{formatValue(point[metricKey])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      )}
    </div>
  );
}
