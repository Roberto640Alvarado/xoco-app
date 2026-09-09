"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInteger, formatShortDate } from "@/lib/format";
import type { DailySalesPoint } from "@/features/sales/types/sales.types";

interface DailyTrafficTableProps {
  title: string;
  data: DailySalesPoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

// Una de las 3 tablas de "Tráfico Diario" (mes ancla / mes anterior / mes
// ante-anterior) — mismo dato que la gráfica de Visitas, solo que día por
// día en tabla en vez de tendencia.
export function DailyTrafficTable({ title, data, isLoading, isError, errorMessage }: DailyTrafficTableProps) {
  const points = data ?? [];
  const total = points.reduce((sum, point) => sum + point.orderCount, 0);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium capitalize text-foreground">{title}</h3>
        {!isLoading && !isError && (
          <span className="text-xs text-muted-foreground">Total: {formatInteger(total)}</span>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Día</TableHead>
              <TableHead>Órdenes</TableHead>
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
                  <TableCell>{formatInteger(point.orderCount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
