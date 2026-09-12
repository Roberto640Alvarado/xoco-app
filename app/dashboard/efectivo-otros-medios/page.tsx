"use client";

import { useState } from "react";
import { SalesFiltersBar } from "@/features/sales/components/sales-filters";
import { StatTile } from "@/components/ui/stat-tile";
import { PaymentMethodsChart } from "@/components/charts/payment-methods-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { usePaymentMethodsSummary } from "@/features/sales/hooks/use-payment-methods-summary";
import { paymentMethodTypeMeta } from "@/features/sales/utils/payment-method-type";
import { formatCurrency, formatInteger, isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import type { SalesFilters } from "@/features/sales/types/sales.types";

// Método de pago en 2 categorías (Efectivo vs. otros medios) más el
// detalle completo por método — mismos filtros de tienda/fecha que el
// resto de reportes de caja. El detalle (gráfica + columna "Tipo" de la
// tabla) distingue tarjeta/transferencia de cuenta de cliente dentro de
// "otros medios" en vez de un "Otro medio" genérico — ver
// features/sales/utils/payment-method-type.ts y plan-history
// "buscador-compradores-efectivo-otros-medios".
export default function EfectivoOtrosMediosPage() {
  const [filters, setFilters] = useState<SalesFilters>({
    dateFrom: isoDateDaysAgo(29),
    dateTo: todayIsoDate(),
  });

  const summary = usePaymentMethodsSummary(filters);
  const methods = summary.data?.methods ?? [];

  return (
    <div className="flex flex-col gap-6">
      <SalesFiltersBar filters={filters} onChange={setFilters} />

      <div>
        <h1 className="text-sm font-medium text-foreground">Efectivo y otros medios</h1>
        <p className="text-xs text-muted-foreground">
          Venta por método de pago, filtrable por tienda y rango de fechas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Efectivo"
          value={formatCurrency(summary.data?.cash.amountTotal ?? 0)}
          isLoading={summary.isLoading}
        />
        <StatTile
          label="Otros medios"
          value={formatCurrency(summary.data?.other.amountTotal ?? 0)}
          isLoading={summary.isLoading}
        />
        <StatTile
          label="Total"
          value={formatCurrency(summary.data?.total.amountTotal ?? 0)}
          isLoading={summary.isLoading}
        />
      </div>

      <PaymentMethodsChart methods={methods} isLoading={summary.isLoading} />

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Detalle por método de pago</h2>

        {summary.isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pagos</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeletonRows rows={5} columns={4} />
            </TableBody>
          </Table>
        ) : methods.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Sin ventas en el rango seleccionado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pagos</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.paymentMethodId}>
                  <TableCell>{method.paymentMethodName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {paymentMethodTypeMeta(method.type).label}
                  </TableCell>
                  <TableCell>{formatInteger(method.paymentCount)}</TableCell>
                  <TableCell>{formatCurrency(method.amountTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
