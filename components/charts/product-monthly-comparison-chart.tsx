"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatInteger, formatMonthLabel } from "@/lib/format";
import type { ProductMonthlyComparison } from "@/features/sales/types/sales.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { ChartErrorState } from "@/components/ui/chart-error-state";

interface ChartRow {
  productId: number;
  productName: string;
  current: number;
  previous: number;
  currentRevenue: number;
  previousRevenue: number;
}

function toChartRow(row: ProductMonthlyComparison): ChartRow {
  return {
    productId: row.productId,
    productName: row.productName,
    current: row.currentMonth.quantity,
    previous: row.previousMonth.quantity,
    currentRevenue: row.currentMonth.revenue,
    previousRevenue: row.previousMonth.revenue,
  };
}

// Leyenda propia (en vez de <Legend/> de recharts) para que el texto se
// quede en tinta neutra y solo el punto lleve el color de la serie — ver
// dataviz skill: "el texto nunca lleva el color de la serie".
function MonthLegend({ currentLabel, previousLabel }: { currentLabel: string; previousLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: "var(--color-chart-1)" }} />
        {currentLabel}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: "var(--color-chart-2)" }} />
        {previousLabel}
      </span>
    </div>
  );
}

function MonthlyComparisonTooltip({
  active,
  payload,
  currentLabel,
  previousLabel,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  currentLabel: string;
  previousLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{row.productName}</p>
      <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2 rounded-full" style={{ backgroundColor: "var(--color-chart-1)" }} />
        {currentLabel}: {formatInteger(row.current)} unidades · {formatCurrency(row.currentRevenue)}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2 rounded-full" style={{ backgroundColor: "var(--color-chart-2)" }} />
        {previousLabel}: {formatInteger(row.previous)} unidades · {formatCurrency(row.previousRevenue)}
      </p>
    </div>
  );
}

interface ProductMonthlyComparisonChartProps {
  data: ProductMonthlyComparison[];
  isLoading: boolean;
  /** `message` del error de la query, si la petición falló (ver ChartErrorState). */
  errorMessage?: string | null;
  title: string;
  emptyLabel: string;
}

// Por cada producto, dos barras horizontales: la del mes en curso (arriba,
// color de acento) y la del mes anterior completo (abajo, gris neutro) —
// mismo par de colores "actual vs. anterior" que el resto del dashboard
// usa para comparar períodos. No toma rango de fechas: el backend siempre
// compara día 1-hoy contra el mes calendario anterior completo (ver
// SalesService.findProductMonthlyComparison), por eso el subtítulo muestra
// los rangos reales que devolvió la API en vez de reusar los filtros de
// arriba.
export function ProductMonthlyComparisonChart({
  data,
  isLoading,
  errorMessage,
  title,
  emptyLabel,
}: ProductMonthlyComparisonChartProps) {
  const chartData = [...data].map(toChartRow).reverse(); // recharts dibuja de abajo hacia arriba
  const rowHeight = 44;

  const currentLabel = data[0] ? formatMonthLabel(data[0].currentMonth.dateFrom) : "";
  const previousLabel = data[0] ? formatMonthLabel(data[0].previousMonth.dateFrom) : "";
  const subtitle = data[0]
    ? `${currentLabel} (parcial, hasta hoy) vs. ${previousLabel} (completo)`
    : "Mes en curso vs. mes anterior";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {!isLoading && data.length > 0 && (
          <MonthLegend currentLabel={currentLabel} previousLabel={previousLabel} />
        )}
      </div>

      {isLoading ? (
        <ChartSkeleton height={256} />
      ) : errorMessage ? (
        <ChartErrorState message={errorMessage} />
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * rowHeight, 200)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
            barCategoryGap={10}
            barGap={2}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="productName"
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              width={140}
              tickFormatter={(name: string) => (name.length > 20 ? `${name.slice(0, 19)}…` : name)}
            />
            <Tooltip
              content={<MonthlyComparisonTooltip currentLabel={currentLabel} previousLabel={previousLabel} />}
              cursor={{ fill: "var(--muted)" }}
            />
            <Bar dataKey="current" name={currentLabel} fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={16} />
            <Bar dataKey="previous" name={previousLabel} fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {data.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Ver tabla
          </summary>
          <div className="mt-2 max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>{currentLabel}</TableHead>
                  <TableHead>{previousLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={row.productId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell>
                      {formatInteger(row.currentMonth.quantity)} u · {formatCurrency(row.currentMonth.revenue)}
                    </TableCell>
                    <TableCell>
                      {formatInteger(row.previousMonth.quantity)} u · {formatCurrency(row.previousMonth.revenue)}
                    </TableCell>
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
