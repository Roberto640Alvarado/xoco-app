"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchPosTickets } from "../api/pos-tickets.api";
import type { PosTicketsFilters } from "../types/pos-tickets.types";

/** Página de órdenes. Mantiene la página anterior mientras llega la nueva
 * para que la tabla no "salte" a vacío al paginar. */
export function usePosTickets(filters: PosTicketsFilters, enabled = true) {
  return useQuery({
    queryKey: ["pos-tickets", "list", filters],
    queryFn: () => fetchPosTickets(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}
