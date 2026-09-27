"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInventoryItems } from "../api/inventory.api";

// `enabled` lo controla InventoryView: a diferencia del resto del
// dashboard, acá la carga NO es automática al elegir tienda — Finanzas
// presiona "Traer inventario" a propósito (pedido explícito del usuario)
// antes de que se dispare esta consulta.
export function useInventoryItems(posConfigId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["inventory", "items", posConfigId],
    queryFn: () => fetchInventoryItems(posConfigId as number),
    enabled: enabled && posConfigId != null,
  });
}
