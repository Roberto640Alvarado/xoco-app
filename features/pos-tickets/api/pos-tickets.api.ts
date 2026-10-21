import { apiGet } from "@/lib/api/client";
import type { PaginatedPosTickets, PosTicketDetail, PosTicketsFilters } from "../types/pos-tickets.types";

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

export function fetchPosTicket(id: number) {
  return apiGet<PosTicketDetail>(`/sales/tickets/${id}`);
}
