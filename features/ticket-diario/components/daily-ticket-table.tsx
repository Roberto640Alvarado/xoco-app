"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { averageTicketOf } from "../types/ticket-diario.types";
import type { DailySalesPoint } from "@/features/sales/types/sales.types";

interface DailyTicketTableProps {
  title: string;
  data: DailySalesPoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

// Una de las 3 tablas de "Ticket Detallado" (mes ancla / mes anterior /
// mes ante-anterior) — mismo dato que Tráfico Diario/Venta Diaria, pero
// mostrando el ticket promedio (venta/órdenes) de cada día.
export function DailyTicketTable({ title, data, isLoading, isError, errorMessage }: DailyTicketTableProps) {
  const points = data ?? [];
  // Promedio del PERÍODO completo (venta total / órdenes totales, no el
  // promedio simple de los promedios diarios) — mismo criterio "blended"
  // que evita que un día con pocas órdenes pese igual que uno con muchas.
  const periodTotals = points.reduce(
    (acc, point) => ({ orders: acc.orders + point.orderCount, revenue: acc.revenue + point.totalRevenue }),
    { orders: 0, revenue: 0 },
  );
  const periodAverage = periodTotals.orders > 0 ? periodTotals.revenue / periodTotals.orders : null;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium capitalize text-foreground">{title}</h3>
        {!isLoading && !isError && (
          <span className="text-xs text-muted-foreground">
            Promedio: {periodAverage != null ? formatCurrency(periodAverage) : "—"}
          </span>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Día</TableHead>
              <TableHead>Ticket promedio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-destructive">
                  No se pudo cargar{errorMessage ? `: ${errorMessage}` : "."}
                </TableCell>
              </TableRow>
            ) : points.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Sin datos.
                </TableCell>
              </TableRow>
            ) : (
              points.map((point) => {
                const ticket = averageTicketOf(point);
                return (
                  <TableRow key={point.date}>
                    <TableCell>{formatShortDate(point.date)}</TableCell>
                    <TableCell>{ticket != null ? formatCurrency(ticket) : "—"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
