"use client";

import { cn } from "cn";
import { formatPercent } from "@/lib/format";
import type { MonthCloseSection } from "../lib/aggregate";

interface MonthCloseSectionTableProps {
  title: string;
  previousMonthLabel: string; // ej. "Junio"
  closeMonthLabel: string; // ej. "Cierre Julio"
  growthColumnLabel: string; // ej. "Crecimiento o decrecimiento vs Junio"
  section: MonthCloseSection;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  formatValue: (value: number) => string;
}

// Una de las 3 secciones apiladas de "Cierre del mes" (Tráfico / Venta /
// Ticket Promedio): réplica de la hoja "CIERRE DE MES" del Excel
// original — mismas 5 columnas en las 3 secciones, una sola fila de
// totales (no por tienda, así lo muestra el Excel). El signo de
// Crecimiento/decrecimiento se colorea igual que "Diferencia" en Ticket
// Promedio (rojo si es negativo), y en verde cuando es positivo.
export function MonthCloseSectionTable({
  title,
  previousMonthLabel,
  closeMonthLabel,
  growthColumnLabel,
  section,
  isLoading,
  isError,
  errorMessage,
  formatValue,
}: MonthCloseSectionTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-normal">{previousMonthLabel}</th>
              <th className="pb-2 pr-4 font-normal">{closeMonthLabel}</th>
              <th className="pb-2 pr-4 font-normal">{growthColumnLabel}</th>
              <th className="pb-2 pr-4 font-normal">Meta</th>
              <th className="pb-2 font-normal">Alcance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-sm text-destructive">
                  No se pudo cargar{errorMessage ? `: ${errorMessage}` : "."}
                </td>
              </tr>
            ) : (
              <tr>
                <td className="py-3 pr-4 text-sm text-foreground">
                  {section.previousTotal != null ? formatValue(section.previousTotal) : "—"}
                </td>
                <td className="py-3 pr-4 text-sm font-medium text-foreground">
                  {section.closeTotal != null ? formatValue(section.closeTotal) : "—"}
                </td>
                <td
                  className={cn(
                    "py-3 pr-4 text-sm font-medium",
                    section.growthPercent == null
                      ? "text-foreground"
                      : section.growthPercent < 0
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {formatPercent(section.growthPercent)}
                </td>
                <td className="py-3 pr-4 text-sm text-foreground">
                  {section.target != null ? formatValue(section.target) : "—"}
                </td>
                <td className="py-3 text-sm text-foreground">{formatPercent(section.reachPercent)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
