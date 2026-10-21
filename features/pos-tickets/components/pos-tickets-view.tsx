"use client";

import { useEffect, useState } from "react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { DollarSign, ReceiptText, Search, ShoppingBag } from "lucide-react";
import { ReportHeader } from "@/features/page-guide/components/report-header";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { StoreSelect } from "@/components/filters/store-select";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatTile } from "@/components/ui/stat-tile";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { Panel } from "@/design-system/components/panel";
import { PAGE_SIZE_OPTIONS } from "@/design-system/components/table-pagination";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { formatCurrency, formatInteger } from "@/lib/format";
import { addDaysIso, isIsoDate, todayLocalIso } from "@/lib/local-date";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { usePosTickets } from "../hooks/use-pos-tickets";
import type { PosTicketSort, PosTicketSummary } from "../types/pos-tickets.types";
import { ticketNumber, ticketState } from "../utils/ticket-format";
import { TicketDetailDialog } from "./ticket-detail-dialog";
import { TicketsList } from "./tickets-list";

const SORTS = ["date_desc", "date_asc", "amount_desc", "amount_asc"] as const satisfies readonly PosTicketSort[];
const SORT_LABEL: Record<PosTicketSort, string> = {
  date_desc: "Más recientes",
  date_asc: "Más antiguas",
  amount_desc: "Mayor total",
  amount_asc: "Menor total",
};
const DEFAULT_PAGE_SIZE = 25;
const MAX_SEARCH_LENGTH = 100; // mismo tope que el DTO de la API

// Filtros en la URL (nuqs): un link compartido abre las mismas órdenes.
// `tienda` se ignora para el Vendedor — siempre ve la suya (la API lo fuerza
// igual).
const URL_PARSERS = {
  desde: parseAsString,
  hasta: parseAsString,
  tienda: parseAsInteger,
  q: parseAsString.withDefault(""),
  orden: parseAsStringLiteral(SORTS).withDefault("date_desc"),
  pagina: parseAsInteger.withDefault(1),
  filas: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
};

/**
 * Tickets → Órdenes: cada orden de caja del rango con su información
 * principal, totales del filtro arriba y el detalle completo (productos,
 * impuestos y pagos) en un modal.
 */
export function PosTicketsView() {
  const [today] = useState(todayLocalIso);
  const { data: stores, isLoading: storesLoading } = useStores();
  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const [query, setQuery] = useQueryStates(URL_PARSERS);
  const [selected, setSelected] = useState<PosTicketSummary | null>(null);

  const dateFrom = isIsoDate(query.desde) ? query.desde : addDaysIso(today, -6);
  const dateTo = isIsoDate(query.hasta) ? query.hasta : today;
  const posConfigId = isVendedor ? defaultPosConfigId : (query.tienda ?? undefined);
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(query.filas) ? query.filas : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, query.pagina);

  // La búsqueda se escribe al instante en la caja, pero solo pide datos (y
  // vuelve a la página 1) cuando se deja de escribir.
  const [searchInput, setSearchInput] = useState(query.q);
  const debouncedSearch = useDebouncedValue(searchInput.trim());
  useEffect(() => {
    if (debouncedSearch !== query.q) void setQuery({ q: debouncedSearch || null, pagina: null });
  }, [debouncedSearch, query.q, setQuery]);

  const tickets = usePosTickets({
    dateFrom,
    dateTo,
    posConfigId,
    search: query.q || undefined,
    sort: query.orden,
    page,
    limit,
  });
  const data = tickets.data;
  const items = data?.items ?? [];
  const totals = data?.totals;
  const isFirstLoad = tickets.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader page="ordenes">
        <DateRangeFilter
          value={{ dateFrom, dateTo }}
          onChange={(range) => void setQuery({ desde: range.dateFrom, hasta: range.dateTo, pagina: null })}
          maxDate={today}
        />
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={(tienda) => void setQuery({ tienda: tienda ?? null, pagina: null })}
          lockedToSingleStore={isVendedor}
        />
        <ExportExcelButton
          filename="ordenes"
          label="Exportar página"
          disabled={isFirstLoad || items.length === 0}
          sheets={() => [
            {
              name: "Órdenes",
              rows: items.map((ticket) => ({
                Orden: ticketNumber(ticket),
                "Orden en Odoo": ticket.name,
                Fecha: ticket.date,
                Hora: ticket.time,
                Estado: ticketState(ticket.state).label,
                Tienda: ticket.store.name,
                Cajero: ticket.cashier?.name ?? "",
                Cliente: ticket.customer?.name ?? "Consumidor final",
                Productos: ticket.lineCount,
                Unidades: ticket.unitCount,
                "Subtotal sin IVA": ticket.amountUntaxed,
                Impuestos: ticket.amountTax,
                Total: ticket.amountTotal,
                Pagado: ticket.amountPaid,
                "Métodos de pago": ticket.paymentMethods.join(", "),
              })),
            },
          ]}
        />
      </ReportHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          icon={ReceiptText}
          label="Órdenes"
          value={formatInteger(totals?.orderCount ?? 0)}
          isLoading={isFirstLoad}
          isError={tickets.isError}
        />
        <StatTile
          icon={DollarSign}
          label="Venta total"
          value={formatCurrency(totals?.totalRevenue ?? 0)}
          isLoading={isFirstLoad}
          isError={tickets.isError}
        />
        <StatTile
          icon={ShoppingBag}
          label="Ticket promedio"
          value={formatCurrency(totals?.averageTicket ?? 0)}
          isLoading={isFirstLoad}
          isError={tickets.isError}
        />
      </div>

      <Panel
        title="Órdenes"
        description="Abre una orden para ver qué se compró y cómo se pagó."
        flush
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchInput}
                maxLength={MAX_SEARCH_LENGTH}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar orden, recibo o cliente"
                aria-label="Buscar orden, recibo o cliente"
                className="pl-8"
              />
            </div>
            <Select value={query.orden} onValueChange={(next) => void setQuery({ orden: next as PosTicketSort, pagina: null })}>
              <SelectTrigger className="w-full sm:w-[170px]" aria-label="Ordenar por">
                <SelectValue>{(raw: string) => SORT_LABEL[raw as PosTicketSort]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((sort) => (
                  <SelectItem key={sort} value={sort}>
                    {SORT_LABEL[sort]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {tickets.isError ? (
          <ChartErrorState message={tickets.error.message} />
        ) : (
          <TicketsList
            tickets={items}
            isLoading={isFirstLoad}
            groupByDay={query.orden === "date_desc" || query.orden === "date_asc"}
            showStore={!isVendedor}
            today={today}
            yesterday={addDaysIso(today, -1)}
            onOpen={setSelected}
            pagination={{
              page: page - 1,
              pageSize: limit,
              total: data?.meta.total ?? 0,
              onPageChange: (next) => void setQuery({ pagina: next + 1 }),
              onPageSizeChange: (size) => void setQuery({ filas: size, pagina: null }),
            }}
          />
        )}
      </Panel>

      <TicketDetailDialog ticket={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
