"use client";

import { ChevronRight, ReceiptText, Store, UserRound, Users } from "lucide-react";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoBadge } from "@/design-system/components/info-badge";
import { TablePagination } from "@/design-system/components/table-pagination";
import { formatCurrency, formatInteger, formatShortDate } from "@/lib/format";
import type { PosTicketSummary } from "../types/pos-tickets.types";
import { formatDayHeader, splitTicketTime, ticketNumber, ticketState } from "../utils/ticket-format";

export interface TicketsListPagination {
  /** Página actual, desde 0. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface TicketsListProps {
  tickets: PosTicketSummary[];
  isLoading: boolean;
  /** Agrupa por día (solo tiene sentido cuando el orden es por fecha). */
  groupByDay: boolean;
  /** El Vendedor solo ve su tienda: mostrarla en cada fila sobra. */
  showStore: boolean;
  today: string;
  yesterday: string;
  pagination: TicketsListPagination;
  onOpen: (ticket: PosTicketSummary) => void;
}

interface DayGroup {
  date: string | null;
  tickets: PosTicketSummary[];
  revenue: number;
}

function groupTickets(tickets: PosTicketSummary[], byDay: boolean): DayGroup[] {
  if (!byDay) return [{ date: null, tickets, revenue: 0 }];
  const groups: DayGroup[] = [];
  for (const ticket of tickets) {
    const last = groups[groups.length - 1];
    if (last && last.date === ticket.date) {
      last.tickets.push(ticket);
      last.revenue += ticket.amountTotal;
    } else {
      groups.push({ date: ticket.date, tickets: [ticket], revenue: ticket.amountTotal });
    }
  }
  return groups;
}

function Meta({ icon: Icon, children }: { icon: typeof Store; children: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function TicketRow({ ticket, showStore, showDate, onOpen }: { ticket: PosTicketSummary; showStore: boolean; showDate: boolean; onOpen: () => void }) {
  const state = ticketState(ticket.state);
  const { clock, period } = splitTicketTime(ticket.date, ticket.time);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalle de ${ticketNumber(ticket)}`}
        className="group grid w-full grid-cols-[3.75rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5 md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,12rem)_7.5rem_6.5rem] md:items-center"
      >
        <span className="flex flex-col leading-tight">
          {showDate && <span className="text-xs text-muted-foreground">{formatShortDate(ticket.date)}</span>}
          <span className="text-lg font-semibold tabular-nums text-foreground">{clock}</span>
          <span className="text-xs text-muted-foreground">{period}</span>
        </span>

        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium break-all text-foreground">{ticketNumber(ticket)}</span>
            <InfoBadge tone={state.tone} dot size="sm">
              {state.label}
            </InfoBadge>
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {showStore && <Meta icon={Store}>{ticket.store.name}</Meta>}
            <Meta icon={UserRound}>{ticket.cashier?.name ?? "Sin cajero"}</Meta>
            <Meta icon={Users}>{ticket.customer?.name ?? "Consumidor final"}</Meta>
          </span>
        </span>

        <span className="flex flex-col items-end gap-0.5 md:hidden">
          <span className="text-base font-semibold tabular-nums text-foreground">{formatCurrency(ticket.amountTotal)}</span>
          <span className="text-xs text-muted-foreground">
            {formatInteger(ticket.lineCount)} {ticket.lineCount === 1 ? "producto" : "productos"}
          </span>
        </span>

        <span className="col-start-2 col-end-4 flex flex-wrap items-center justify-between gap-2 md:col-auto md:justify-start">
          <span className="flex flex-wrap gap-1">
            {ticket.paymentMethods.map((method) => (
              <InfoBadge key={method} tone="neutral" size="sm">
                {method}
              </InfoBadge>
            ))}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-foreground md:hidden">
            Ver detalle
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </span>
        </span>

        <span className="hidden flex-col items-end md:flex">
          <span className="text-base font-semibold tabular-nums text-foreground">{formatCurrency(ticket.amountTotal)}</span>
          <span className="text-xs text-muted-foreground">
            {formatInteger(ticket.lineCount)} {ticket.lineCount === 1 ? "producto" : "productos"}
            {ticket.unitCount > 0 && `, ${formatInteger(ticket.unitCount)} u`}
          </span>
        </span>

        <span className="hidden items-center justify-end md:flex">
          <span className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors group-hover:border-foreground/30 group-hover:bg-background">
            Ver detalle
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * Listado de órdenes de la página actual, agrupado por día cuando el orden es
 * por fecha. Cada fila es un botón que abre el detalle: la hora va grande a
 * la izquierda (es lo que se busca primero), luego número, estado y quién
 * atendió a quién, el pago y el total. En móvil se reacomoda en dos líneas
 * sin scroll horizontal.
 */
export function TicketsList({ tickets, isLoading, groupByDay, showStore, today, yesterday, pagination, onOpen }: TicketsListProps) {
  const groups = groupTickets(tickets, groupByDay);

  return (
    <div>
      {isLoading ? (
        <ul className="divide-y divide-border" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-9 w-14" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
              <Skeleton className="h-5 w-16" />
            </li>
          ))}
        </ul>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ReceiptText className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-foreground">No hay órdenes con estos filtros</p>
          <p className="max-w-sm text-sm text-muted-foreground">Prueba con otro rango de fechas, otra tienda o borra la búsqueda.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.date ?? "all"} aria-label={group.date ? formatDayHeader(group.date, today, yesterday) : "Órdenes"}>
            {group.date && (
              <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-y border-border bg-muted/40 px-4 py-2 first:border-t-0 sm:px-5">
                <h3 className="text-sm font-semibold text-foreground">{formatDayHeader(group.date, today, yesterday)}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatInteger(group.tickets.length)} {group.tickets.length === 1 ? "orden" : "órdenes"} en esta página, {formatCurrency(group.revenue)}
                </p>
              </header>
            )}
            <ul className={cn("divide-y divide-border", !group.date && "border-t border-border")}>
              {group.tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} showStore={showStore} showDate={!groupByDay} onOpen={() => onOpen(ticket)} />
              ))}
            </ul>
          </section>
        ))
      )}

      <TablePagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        pageRowCount={tickets.length}
        itemLabel={{ singular: "orden", plural: "órdenes" }}
        onPageChange={pagination.onPageChange}
        onPageSizeChange={pagination.onPageSizeChange}
      />
    </div>
  );
}
