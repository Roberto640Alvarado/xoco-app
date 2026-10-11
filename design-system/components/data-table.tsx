"use client";

import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, FilterX, ListFilter, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const ALL = "__all__";

export interface DataTableColumn<T> {
  id: string;
  /** Contenido del encabezado (puede incluir un ⓘ, etc.). */
  header: ReactNode;
  /** Texto plano del encabezado — se usa como etiqueta en la vista móvil y
   * en los filtros. */
  label: string;
  /** Celda de la fila. `index` es la posición dentro de los resultados ya
   * filtrados (0 = primera fila, sin importar la página). */
  cell: (row: T, index: number) => ReactNode;
  /** Valor de texto de la fila para esta columna — lo que comparan los
   * filtros. Obligatorio si la columna tiene `filter`. */
  accessor?: (row: T) => string;
  /** "text": caja de texto (contiene). "select": lista de valores; si no hay
   * `filterOptions`, se arma con los valores distintos de `accessor`. */
  filter?: "text" | "select";
  filterOptions?: Array<{ value: string; label: string }>;
  align?: "left" | "right";
  /** Clases extra para la celda y el encabezado (ej. ancho, nowrap). */
  className?: string;
  /** Por defecto las celdas hacen wrap (whitespace-normal); "nowrap" las
   * mantiene en una línea (fechas, cantidades). */
  nowrap?: boolean;
  /** Ancla del tour guiado (data-tour) en el encabezado de la columna. */
  tourId?: string;
  /** Vista móvil: "title" es el título de la tarjeta, "footer" va al pie
   * (acciones) y "hidden" no se muestra. Sin esto, va en la cuadrícula. */
  mobile?: "title" | "footer" | "hidden";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Texto de la unidad en el pie ("resultados" por defecto). */
  itemLabel?: { singular: string; plural: string };
  defaultPageSize?: (typeof PAGE_SIZE_OPTIONS)[number];
  /** Ancla del tour guiado del contenedor y de la fila de filtros. */
  tourId?: string;
  /** Ancla del tour guiado del primer botón de filtro de la tabla. */
  filtersTourId?: string;
  /** Muestra el ícono de filtro en el encabezado de cada columna con `filter`
   * (por defecto sí). Se apaga cuando los filtros viven arriba, en la card. */
  columnFilters?: boolean;
  /** Si viene, la fila completa es clicable (ej. abrir un modal de detalle). */
  onRowClick?: (row: T) => void;
  className?: string;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

interface ColumnFilterProps {
  label: string;
  type: "text" | "select";
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  tourId?: string;
}

// Ícono de filtro junto al texto del encabezado: abre un popover con la caja
// de texto o la lista de valores de esa columna. Se resalta cuando está activo.
function ColumnFilter({ label, type, value, options, onChange, tourId }: ColumnFilterProps) {
  const active = value !== "";
  return (
    <Popover>
      <PopoverTrigger
        data-tour={tourId}
        aria-label={`Filtrar por ${label}${active ? " (filtro activo)" : ""}`}
        className={cn(
          "relative inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          active ? "bg-primary/10 text-primary" : "text-muted-foreground",
        )}
      >
        <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
        {active && <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary" aria-hidden="true" />}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3 font-normal">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Filtrar por {label.toLowerCase()}</p>
        {type === "text" ? (
          <div className="relative">
            <Input
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Escribe para filtrar..."
              aria-label={`Filtrar por ${label}`}
              autoFocus
              className="pr-8"
            />
            {active && (
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Quitar filtro"
                className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        ) : (
          <ul className="flex max-h-60 flex-col gap-0.5 overflow-y-auto" role="listbox" aria-label={label}>
            {[{ value: "", label: "Todos" }, ...options].map((option) => (
              <li key={option.value || ALL}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => onChange(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted",
                    value === option.value && "bg-muted font-medium",
                  )}
                >
                  {option.label}
                  {value === option.value && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Tabla estándar de las pantallas de Inventario: encabezado fijo, fila de
 * filtros por columna (texto o lista), pie con el total de resultados y
 * selector de filas por página (10 / 25 / 50 / 100) con paginación, y wrap
 * de texto. En pantallas chicas se convierte en tarjetas apiladas (con sus
 * filtros en un panel plegable) para que no haga falta scroll horizontal.
 *
 * El filtrado y la paginación son del lado del cliente sobre `rows` — el
 * componente no sabe de la fuente de datos.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading = false,
  emptyMessage = "No hay resultados.",
  itemLabel = { singular: "resultado", plural: "resultados" },
  defaultPageSize = 10,
  tourId,
  filtersTourId,
  columnFilters = true,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filterable = useMemo(
    () => (columnFilters ? columns.filter((column) => column.filter && column.accessor) : []),
    [columnFilters, columns],
  );
  const activeFilters = Object.values(filters).filter((value) => value !== "").length;

  // Opciones de las listas: las dadas, o los valores distintos presentes.
  const selectOptions = useMemo(() => {
    const result: Record<string, Array<{ value: string; label: string }>> = {};
    for (const column of filterable) {
      if (column.filter !== "select") continue;
      if (column.filterOptions) {
        result[column.id] = column.filterOptions;
        continue;
      }
      const distinct = Array.from(new Set(rows.map((row) => column.accessor!(row)).filter((value) => value !== "")));
      result[column.id] = distinct.sort((a, b) => a.localeCompare(b)).map((value) => ({ value, label: value }));
    }
    return result;
  }, [filterable, rows]);

  const filteredRows = useMemo(() => {
    const entries = Object.entries(filters).filter(([, value]) => value !== "");
    if (entries.length === 0) return rows;
    return rows.filter((row) =>
      entries.every(([id, value]) => {
        const column = columns.find((c) => c.id === id);
        if (!column?.accessor) return true;
        const cellValue = column.accessor(row);
        return column.filter === "select" ? cellValue === value : normalize(cellValue).includes(normalize(value));
      }),
    );
  }, [rows, filters, columns]);

  const total = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const pageRows = filteredRows.slice(start, start + pageSize);
  const from = total === 0 ? 0 : start + 1;
  const to = start + pageRows.length;
  const unit = (count: number) => (count === 1 ? itemLabel.singular : itemLabel.plural);

  function setFilter(id: string, value: string) {
    setFilters((current) => ({ ...current, [id]: value }));
    setPage(0);
  }

  function clearFilters() {
    setFilters({});
    setPage(0);
  }

  // Fila clicable: ignora los clics que vienen de botones/inputs internos.
  function rowClickProps(row: T) {
    if (!onRowClick) return {};
    return {
      tabIndex: 0,
      onClick: (event: ReactMouseEvent) => {
        if ((event.target as HTMLElement).closest("button, a, input, select, textarea, [role=option]")) return;
        onRowClick(row);
      },
      onKeyDown: (event: ReactKeyboardEvent) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onRowClick(row);
        }
      },
    };
  }

  function filterControl(column: DataTableColumn<T>, compact: boolean) {
    const value = filters[column.id] ?? "";
    if (column.filter === "text") {
      return (
        <Input
          type="text"
          value={value}
          onChange={(event) => setFilter(column.id, event.target.value)}
          placeholder={compact ? "Filtrar..." : `Filtrar ${column.label.toLowerCase()}...`}
          aria-label={`Filtrar por ${column.label}`}
          className={cn("w-full min-w-24", compact && "h-8 text-xs")}
        />
      );
    }
    const options = selectOptions[column.id] ?? [];
    return (
      <Select value={value || ALL} onValueChange={(next) => setFilter(column.id, next === ALL ? "" : (next as string))}>
        <SelectTrigger
          aria-label={`Filtrar por ${column.label}`}
          className={cn("w-full min-w-24 gap-1", compact && "h-8 text-xs")}
        >
          <SelectValue>
            {(raw: string) =>
              raw === ALL ? "Todos" : (options.find((option) => option.value === raw)?.label ?? raw)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const titleColumn = columns.find((column) => column.mobile === "title") ?? columns[0];
  const footerColumns = columns.filter((column) => column.mobile === "footer");
  const gridColumns = columns.filter(
    (column) => column !== titleColumn && column.mobile !== "footer" && column.mobile !== "hidden",
  );

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)} data-tour={tourId}>
      {/* Escritorio / tablet: tabla con encabezado y fila de filtros */}
      <div className="hidden max-h-[65vh] overflow-y-auto md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              {columns.map((column) => {
                const filterIndex = filterable.indexOf(column);
                return (
                  <TableHead
                    key={column.id}
                    data-tour={column.tourId}
                    className={cn("whitespace-normal", column.align === "right" && "text-right", column.className)}
                  >
                    <div className={cn("flex items-center gap-1", column.align === "right" && "justify-end")}>
                      <div className="min-w-0">{column.header}</div>
                      {filterIndex >= 0 && (
                        <ColumnFilter
                          label={column.label}
                          type={column.filter!}
                          value={filters[column.id] ?? ""}
                          options={selectOptions[column.id] ?? []}
                          onChange={(next) => setFilter(column.id, next)}
                          tourId={filterIndex === 0 ? filtersTourId : undefined}
                        />
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rows={5} columns={columns.length} />
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                  {rows.length > 0 && activeFilters > 0 ? "Ningún resultado coincide con los filtros." : emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, offset) => (
                <TableRow
                  key={getRowKey(row)}
                  {...rowClickProps(row)}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "align-top",
                        column.nowrap ? "whitespace-nowrap" : "whitespace-normal break-words",
                        column.align === "right" && "text-right",
                        column.className,
                      )}
                    >
                      {column.cell(row, start + offset)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Móvil: tarjetas apiladas (sin scroll horizontal) */}
      <div className="md:hidden">
        {filterable.length > 0 && (
          <div className="flex flex-col gap-2 border-b border-border p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltersOpen((open) => !open)}
              aria-expanded={mobileFiltersOpen}
              className="self-start"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </Button>
            {mobileFiltersOpen && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filterable.map((column) => (
                  <label key={column.id} className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {column.label}
                    {filterControl(column, false)}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {rows.length > 0 && activeFilters > 0 ? "Ningún resultado coincide con los filtros." : emptyMessage}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pageRows.map((row, offset) => (
              <li
                key={getRowKey(row)}
                {...rowClickProps(row)}
                className={cn("flex flex-col gap-3 p-3", onRowClick && "cursor-pointer hover:bg-muted/40")}
              >
                <div className="min-w-0 break-words text-sm font-medium text-foreground">
                  {titleColumn.cell(row, start + offset)}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {gridColumns.map((column) => (
                    <div key={column.id} className="min-w-0">
                      <dt className="text-[11px] font-medium text-muted-foreground">{column.label}</dt>
                      <dd className="break-words text-sm text-foreground">{column.cell(row, start + offset)}</dd>
                    </div>
                  ))}
                </dl>
                {footerColumns.map((column) => (
                  <div key={column.id}>{column.cell(row, start + offset)}</div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pie: total de resultados, filas por página y paginación */}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p>
            {total === 0 ? (
              <>0 {itemLabel.plural}</>
            ) : (
              <>
                Mostrando <span className="font-medium text-foreground">{from}–{to}</span> de{" "}
                <span className="font-medium text-foreground">{total}</span> {unit(total)}
              </>
            )}
            {activeFilters > 0 && rows.length !== total && <span> (de {rows.length} en total)</span>}
          </p>
          {activeFilters > 0 && (
            <Button type="button" variant="ghost" size="xs" onClick={clearFilters}>
              <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2">
            Filas por página
            <Select
              value={String(pageSize)}
              onValueChange={(next) => {
                setPageSize(Number(next));
                setPage(0);
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
              Página <span className="font-medium text-foreground">{safePage + 1}</span> de {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              aria-label="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= pageCount - 1}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(pageCount - 1)}
              disabled={safePage >= pageCount - 1}
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
