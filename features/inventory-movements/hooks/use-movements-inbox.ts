"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMovementsInbox } from "../api/inventory-movements.api";

// Bandeja de Admin/Finanzas: merma/regalía/degustación abiertas de TODAS
// las tiendas. `enabled` deja que el Vendedor (que no tiene este endpoint)
// nunca lo consulte.
export function useMovementsInbox(enabled: boolean) {
  return useQuery({
    queryKey: ["inventory", "inbox"],
    queryFn: fetchMovementsInbox,
    enabled,
    refetchInterval: 60_000,
  });
}
