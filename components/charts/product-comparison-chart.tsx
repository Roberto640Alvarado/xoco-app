"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatInteger } from "@/lib/format";
import type { ProductComparisonItem, ProductComparisonMetric } from "@/features/sales/types/sales.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { ChangeIndicator } from "@/design-system/components/change-indicator";

interface ChartRow {
  productId: number;
  productName: string;
  a: number;
  b: number;
  quantityA: number;
  quantityB: number;
  revenueA: number;
  revenueB: number;
}

function toChartRow(item: ProductComparisonItem, metric: ProductComparisonMetric): ChartRow {
  return {
    productId: item.productId,
    productName: item.productName,
    a: item.periodA[metric],
    b: item.periodB[metric],
    quantityA: item.periodA.quantity,
    quantityB: item.periodB.quantity,
    revenueA: item.periodA.revenue,
    revenueB: item.periodB.revenue,
  };
}

// Leyenda propia (en vez de <Legend/> de recharts) para que el texto se
// quede en tinta neutra y solo el punto lleve el color de la serie — ver
// dataviz skill: "el texto nunca lleva el color de la serie".
function PeriodLegend({ labelA, labelB }: { labelA: string; labelB: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: "var(--color-chart-1)" }} />
        {labelA}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: "var(--color-chart-2)" }} />
        {labelB}
      </span>
    </div>
  );
}

function ComparisonTooltip({
  active,
  payload,
  labelA,
  labelB,
  metric,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  labelA: string;
  labelB: string;
  metric: ProductComparisonMetric;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">{row.productName}</p>
        <ChangeIndicator diff={row.a - row.b} pct={row.b === 0 ? null : (row.a - row.b) / row.b} />
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2 rounded-full" style={{ backgroundColor: "var(--color-chart-1)" }} />
        {labelA}: {formatInteger(row.quantityA)} unidades · {formatCurrency(row.revenueA)}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2 rounded-full" style={{ backgroundColor: "var(--color-chart-2)" }} />
        {labelB}: {formatInteger(row.quantityB)} unidades · {formatCurrency(row.revenueB)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Cambio en {metric === "quantity" ? "unidades" : "ingresos"}</p>
    </div>
  );
}

interface ProductComparisonChartProps {
  items: ProductComparisonItem[];
  metric: ProductComparisonMetric;
  labelA: string;
  labelB: string;
  isLoading: boolean;
  /** `message` del error de la query, si la petición falló (ver ChartErrorState). */
  errorMessage?: string | null;
  emptyLabel: string;
}

// Por cada producto, dos barras horizontales: la del período A (arriba,
// color de acento) y la del período B (abajo, gris neutro) — mismo par de
// colores "actual vs. anterior" que el resto del dashboard usa para comparar
// períodos. Recibe los productos ya ordenados y recortados: el orden y el
// "Mostrar N" los decide la pantalla.
export function ProductComparisonChart({
  items,
  metric,
  labelA,
  labelB,
  isLoading,
  errorMessage,
  emptyLabel,
}: ProductComparisonChartProps) {
  const chartData = items.map((item) => toChartRow(item, metric));
  const rowHeight = 44;

  if (isLoading) return <ChartSkeleton height={256} />;
  if (errorMessage) return <ChartErrorState message={errorMessage} />;
  if (items.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <PeriodLegend labelA={labelA} labelB={labelB} />
      <ResponsiveContainer width="100%" height={Math.max(chartData.length * rowHeight, 200)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap={10} barGap={2}>
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
          content={<ComparisonTooltip labelA={labelA} labelB={labelB} metric={metric} />}
          cursor={{ fill: "var(--muted)" }}
        />
        <Bar dataKey="a" name={labelA} fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={16} />
        <Bar dataKey="b" name={labelB} fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
