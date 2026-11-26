import { apiGet } from "@/lib/api/client";
import type { PaginatedPosTickets, PosTicketDetail, PosTicketsFilters, PosTicketSummary } from "../types/pos-tickets.types";

// Para un Vendedor la API ignora posConfigId y usa su tienda; el detalle de
// una orden de otra tienda responde 403.
export function fetchPosTickets(filters: PosTicketsFilters) {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sort: filters.sort,
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.posConfigId) params.set("posConfigId", String(filters.posConfigId));
  if (filters.search) params.set("search", filters.search);
  return apiGet<PaginatedPosTickets>(`/sales/tickets?${params.toString()}`);
}

/** Tope de la API por página (MAX_TICKETS_PAGE_SIZE en xoco-api). */
const EXPORT_PAGE_SIZE = 100;

/** TODAS las órdenes del filtro (todas las páginas), para exportar. */
export async function fetchAllPosTickets(filters: Omit<PosTicketsFilters, "page" | "limit">): Promise<PosTicketSummary[]> {
  const first = await fetchPosTickets({ ...filters, page: 1, limit: EXPORT_PAGE_SIZE });
  const items = [...first.items];
  const totalPages = first.meta.totalPages;
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPosTickets({ ...filters, page, limit: EXPORT_PAGE_SIZE });
    items.push(...next.items);
  }
  return items;
}

export function fetchPosTicket(id: number) {
  return apiGet<PosTicketDetail>(`/sales/tickets/${id}`);
}
