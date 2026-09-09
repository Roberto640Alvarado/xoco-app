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
import type { DailySalesPoint } from "@/features/sales/types/sales.types";

interface DailySalesTableProps {
  title: string;
  data: DailySalesPoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

// Una de las 3 tablas de "Venta Diaria" (mes ancla / mes anterior / mes
// ante-anterior) — mismo dato que Tráfico Diario, solo que en dólares
// (totalRevenue) en vez de cantidad de órdenes.
export function DailySalesTable({ title, data, isLoading, isError, errorMessage }: DailySalesTableProps) {
  const points = data ?? [];
  const total = points.reduce((sum, point) => sum + point.totalRevenue, 0);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium capitalize text-foreground">{title}</h3>
        {!isLoading && !isError && (
          <span className="text-xs text-muted-foreground">Total: {formatCurrency(total)}</span>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Día</TableHead>
              <TableHead>Venta</TableHead>
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
              points.map((point) => (
                <TableRow key={point.date}>
                  <TableCell>{formatShortDate(point.date)}</TableCell>
                  <TableCell>{formatCurrency(point.totalRevenue)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
