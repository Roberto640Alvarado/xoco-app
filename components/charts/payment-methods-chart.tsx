"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { PaymentMethodTotals } from "@/features/sales/types/sales.types";
import { paymentMethodTypeMeta } from "@/features/sales/utils/payment-method-type";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { ChartErrorState } from "@/components/ui/chart-error-state";

function PaymentMethodTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PaymentMethodTotals }[];
}) {
  if (!active || !payload?.length) return null;
  const method = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{method.paymentMethodName}</p>
      <p className="mt-0.5 text-muted-foreground">{paymentMethodTypeMeta(method.type).label}</p>
      <p className="mt-0.5 text-muted-foreground">{formatCurrency(method.amountTotal)}</p>
    </div>
  );
}

interface PaymentMethodsChartProps {
  methods: PaymentMethodTotals[];
  isLoading: boolean;
  /** `message` del error de la query, si la petición falló (ver ChartErrorState). */
  errorMessage?: string | null;
}

// Gráfica de barras horizontal, un método de pago por fila — a
// diferencia de los 3 StatTile (Efectivo/Otros medios/Total, que
// resumen), acá se ve el detalle real: cada método con su propio nombre
// y color según `type` de Odoo (ver payment-method-type.ts). Es lo que
// permite distinguir, dentro de "otros medios", cuánto es tarjeta,
// cuánto transferencia/apps y cuánto cuenta de cliente — pedido
// explícito del negocio tras ver que la tabla colapsaba todo eso a un
// "Otro medio" genérico.
export function PaymentMethodsChart({ methods, isLoading, errorMessage }: PaymentMethodsChartProps) {
  const chartData = [...methods].reverse(); // recharts dibuja de abajo hacia arriba
  const rowHeight = 32;
  const typesPresent = [...new Set(methods.map((method) => method.type))];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="text-sm font-medium text-foreground">Venta por método de pago</h2>
        <div className="flex flex-wrap items-center gap-3">
          {typesPresent.map((type) => {
            const meta = paymentMethodTypeMeta(type);
            return (
              <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: meta.color }}
                  aria-hidden="true"
                />
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <ChartSkeleton height={256} />
      ) : errorMessage ? (
        <ChartErrorState message={errorMessage} />
      ) : methods.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Sin ventas en el rango seleccionado
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
              dataKey="paymentMethodName"
              axisLine={false}
              tickLine={false}
              stroke="var(--muted-foreground)"
              fontSize={12}
              width={140}
              tickFormatter={(name: string) => (name.length > 20 ? `${name.slice(0, 19)}…` : name)}
            />
            <Tooltip content={<PaymentMethodTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Bar
              dataKey="amountTotal"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              label={{
                position: "right",
                fill: "var(--muted-foreground)",
                fontSize: 12,
                formatter: (value: unknown) => (typeof value === "number" ? formatCurrency(value) : String(value ?? "")),
              }}
            >
              {chartData.map((entry) => (
                <Cell key={entry.paymentMethodId} fill={paymentMethodTypeMeta(entry.type).color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
