"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInventoryLedger } from "../api/inventory-ledger.api";
import type { InventoryLedgerFilters } from "../types/inventory-ledger.types";

// Carga automática al elegir tienda/filtros, igual que el resto del
// dashboard — el rango siempre viaja completo (el backend lo exige).
export function useInventoryLedger(filters: InventoryLedgerFilters | undefined) {
  return useQuery({
    queryKey: ["inventory", "ledger", filters],
    queryFn: () => fetchInventoryLedger(filters as InventoryLedgerFilters),
    enabled: filters != null,
  });
}
