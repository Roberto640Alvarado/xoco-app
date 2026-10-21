"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface TablePaginationProps {
  /** Página actual, desde 0. */
  page: number;
  pageSize: number;
  /** Total de filas (todas las páginas). */
  total: number;
  /** Filas que se ven en esta página. */
  pageRowCount: number;
  itemLabel: { singular: string; plural: string };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Junto al "Mostrando X–Y de N" (ej. "Limpiar filtros"). */
  summaryExtra?: ReactNode;
}

/**
 * Pie de tabla o listado: "Mostrando X–Y de N", filas por página (10, 25, 50,
 * 100) y botones de primera/anterior/siguiente/última página. Lo usa
 * DataTable y cualquier listado propio con paginación (ej. Tickets → Órdenes).
 */
export function TablePagination({
  page,
  pageSize,
  total,
  pageRowCount,
  itemLabel,
  onPageChange,
  onPageSizeChange,
  summaryExtra,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = page * pageSize + pageRowCount;
  const unit = total === 1 ? itemLabel.singular : itemLabel.plural;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p>
          {total === 0 ? (
            <>0 {itemLabel.plural}</>
          ) : (
            <>
              Mostrando <span className="font-medium text-foreground">{from}–{to}</span> de{" "}
              <span className="font-medium text-foreground">{total}</span> {unit}
            </>
          )}
        </p>
        {summaryExtra}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2">
          Filas por página
          <Select
            value={String(pageSize)}
            onValueChange={(next) => {
              onPageSizeChange(Number(next));
              onPageChange(0);
            }}
          >
            <SelectTrigger size="sm" aria-label="Filas por página" className="w-[4.5rem] gap-1">
              <SelectValue>{(raw: string) => raw}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-center gap-1">
          <span className="mr-1 tabular-nums">
            Página <span className="font-medium text-foreground">{page + 1}</span> de {pageCount}
          </span>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => onPageChange(0)} disabled={page === 0} aria-label="Primera página">
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page === 0} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount - 1}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={page >= pageCount - 1}
            aria-label="Última página"
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
