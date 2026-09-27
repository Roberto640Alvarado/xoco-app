"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInventoryItems } from "../api/inventory.api";

// Carga automática al elegir tienda (mismo criterio que el resto del
// dashboard) — el botón "Actualizar inventario" de InventoryView solo
// dispara un refetch manual, no gatea la carga inicial.
export function useInventoryItems(posConfigId: number | undefined) {
  return useQuery({
    queryKey: ["inventory", "items", posConfigId],
    queryFn: () => fetchInventoryItems(posConfigId as number),
    enabled: posConfigId != null,
  });
}
