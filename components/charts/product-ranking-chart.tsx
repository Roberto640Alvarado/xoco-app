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
import { formatCurrency, formatInteger } from "@/lib/format";
import type { TopProduct } from "@/features/sales/types/sales.types";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";

function ProductTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TopProduct }[];
}) {
  if (!active || !payload?.length) return null;
  const product = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{product.productName}</p>
      <p className="mt-0.5 text-muted-foreground">
        {formatInteger(product.totalQuantity)} unidades · {formatCurrency(product.totalRevenue)}
      </p>
    </div>
  );
}

interface ProductRankingChartProps {
  data: TopProduct[];
  isLoading: boolean;
  title: string;
  subtitle: string;
  emptyLabel: string;
  /** Control adicional en el header (ej. input de "mostrar N"), a la derecha del subtitle. */
  headerExtra?: ReactNode;
}

// Ranking por magnitud (unidades vendidas), no identidad: todas las barras
// llevan el mismo color — no es un caso de paleta categórica. Barras
// horizontales porque los nombres de producto no caben como labels de eje X.
// Sirve tanto para "más vendidos" (data ya viene ordenada desc del backend)
// como para "menos vendidos" (data ordenada asc) — este componente no
// reordena, solo dibuja en el orden que recibe.
export function ProductRankingChart({
  data,
  isLoading,
  title,
  subtitle,
  emptyLabel,
  headerExtra,
}: ProductRankingChartProps) {
  const chartData = [...data].reverse(); // recharts dibuja de abajo hacia arriba
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
      ) : data.length === 0 ? (
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
            <Tooltip content={<ProductTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Bar
              dataKey="totalQuantity"
              fill="var(--color-chart-1)"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              label={{
                position: "right",
                fill: "var(--muted-foreground)",
                fontSize: 12,
                formatter: (value: unknown) =>
                  typeof value === "number" ? formatInteger(value) : String(value ?? ""),
              }}
            />
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
                  <TableHead>Unidades</TableHead>
                  <TableHead>Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((product, index) => (
                  <TableRow key={product.productId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>{formatInteger(product.totalQuantity)}</TableCell>
                    <TableCell>{formatCurrency(product.totalRevenue)}</TableCell>
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
