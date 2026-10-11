"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInventoryMovements } from "../api/inventory-movements.api";

// Mismo criterio que useInventoryItems: carga automática al elegir
// tienda, nada de gate manual.
export function useInventoryMovements(posConfigId: number | undefined) {
  return useQuery({
    queryKey: ["inventory", "movements", posConfigId],
    queryFn: () => fetchInventoryMovements(posConfigId as number),
    enabled: posConfigId != null,
  });
}
