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
import { formatCurrency } from "@/lib/format";
import type { CategoryProduct } from "@/features/sales/types/sales.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";

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
      <p className="mt-0.5 text-muted-foreground">{formatCurrency(product.revenue)}</p>
    </div>
  );
}

interface CategoryTopProductsChartProps {
  products: CategoryProduct[];
  isLoading: boolean;
  title: string;
  subtitle: string;
  emptyLabel: string;
  /** Control adicional en el header (ej. input de "mostrar N"), a la derecha del subtitle. */
  headerExtra?: ReactNode;
}

// Un bloque por categoría (ver app/dashboard/categorias/page.tsx, que
// renderiza uno de estos por cada categoría que devuelve el backend).
// Ranking por INGRESOS, no por unidades — a diferencia de
// ProductRankingChart, acá conviven productos por pieza y a granel (ej.
// "Crocks") en el mismo ranking, porque el ingreso ($) es la única unidad
// comparable entre ambos (ver SalesService.findTopProductsByCategory).
export function CategoryTopProductsChart({
  products,
  isLoading,
  title,
  subtitle,
  emptyLabel,
  headerExtra,
}: CategoryTopProductsChartProps) {
  const chartData = [...products].reverse(); // recharts dibuja de abajo hacia arriba
  const rowHeight = 32;

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
              dataKey="revenue"
              fill="var(--color-chart-1)"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              label={{
                position: "right",
                fill: "var(--muted-foreground)",
                fontSize: 12,
                formatter: (value: unknown) => (typeof value === "number" ? formatCurrency(value) : String(value ?? "")),
              }}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product.productId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>{formatCurrency(product.revenue)}</TableCell>
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
