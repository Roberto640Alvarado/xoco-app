"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatInteger, formatKg } from "@/lib/format";
import type { CategoryProduct, CategoryProductMetric } from "@/features/sales/types/sales.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { ChartErrorState } from "@/components/ui/chart-error-state";

// "0.5" + "kg" -> "0.5 kg"; "12" + "unidad" -> "12 u". Los dos únicos
// `unit` que puede traer un CategoryProduct (ver sales.types.ts).
function formatQuantity(quantity: number, unit: CategoryProduct["unit"]): string {
  return unit === "kg" ? formatKg(quantity) : `${formatInteger(quantity)} u`;
}

function CategoryProductTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoryProduct }[];
}) {
  if (!active || !payload?.length) return null;
  const product = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{product.productName}</p>
      <p className="mt-0.5 text-muted-foreground">Ingresos: {formatCurrency(product.revenue)}</p>
      <p className="text-muted-foreground">Cantidad: {formatQuantity(product.quantity, product.unit)}</p>
    </div>
  );
}

interface BarValueLabelProps {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  height?: string | number;
  index?: number;
}

interface CategoryTopProductsChartProps {
  products: CategoryProduct[];
  isLoading: boolean;
  /** `message` del error de la query, si la petición falló (ver ChartErrorState). */
  errorMessage?: string | null;
  title: string;
  subtitle: string;
  emptyLabel: string;
  /** Qué campo dibuja la barra y ordena la columna de valor de "Ver tabla" — el orden de los productos ya lo decide el backend (ver `metric` en useProductRankingByCategory); esto solo cambia qué se muestra. */
  metric: CategoryProductMetric;
  /** Control adicional en el header (ej. input de "mostrar N"), a la derecha del subtitle. */
  headerExtra?: ReactNode;
}

// Un bloque por categoría (ver app/dashboard/categorias/page.tsx, que
// renderiza uno de estos por cada categoría que devuelve el backend). A
// diferencia de ProductRankingChart, acá conviven productos por pieza y a
// granel (ej. "Crocks") en el mismo ranking: por ingresos ($) porque es
// comparable entre ambos tipos, por cantidad porque cada producto lleva
// su propia unidad (`unit`) — ver SalesService.findTopProductsByCategory.
// El tooltip y "Ver tabla" siempre muestran las 2 columnas; solo la barra
// y su label cambian según `metric`.
export function CategoryTopProductsChart({
  products,
  isLoading,
  errorMessage,
  title,
  subtitle,
  emptyLabel,
  metric,
  headerExtra,
}: CategoryTopProductsChartProps) {
  const chartData = [...products].reverse(); // recharts dibuja de abajo hacia arriba
  const rowHeight = 32;

  function renderValueLabel(props: BarValueLabelProps) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const height = Number(props.height ?? 0);
    const row = chartData[props.index ?? 0];
    if (!row) return null;
    const text = metric === "revenue" ? formatCurrency(row.revenue) : formatQuantity(row.quantity, row.unit);
    return (
      <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={12} fill="var(--muted-foreground)">
        {text}
      </text>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">{subtitle}</span>
          {headerExtra}
        </div>
      </div>

      {isLoading ? (
        <ChartSkeleton height={256} />
      ) : errorMessage ? (
        <ChartErrorState message={errorMessage} />
      ) : products.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * rowHeight, 160)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
            barCategoryGap={6}
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
            <Tooltip content={<CategoryProductTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Bar
              dataKey={metric}
              fill="var(--color-chart-1)"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              label={renderValueLabel}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {products.length > 0 && (
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
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product.productId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>{formatCurrency(product.revenue)}</TableCell>
                    <TableCell>{formatQuantity(product.quantity, product.unit)}</TableCell>
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
