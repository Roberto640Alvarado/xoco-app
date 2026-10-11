"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMovementsInbox } from "../api/inventory-movements.api";
import type { MovementsInboxKind } from "../types/inventory-movement.types";

// Bandeja de Admin/Finanzas: lo abierto de TODAS las tiendas. `enabled`
// deja que el Vendedor (que no tiene este endpoint) nunca lo consulte.
export function useMovementsInbox(kind: MovementsInboxKind, enabled: boolean) {
  return useQuery({
    queryKey: ["inventory", "inbox", kind],
    queryFn: () => fetchMovementsInbox(kind),
    enabled,
    refetchInterval: 60_000,
  });
}
