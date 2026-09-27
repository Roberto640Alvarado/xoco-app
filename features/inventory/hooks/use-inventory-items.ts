"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInventoryItems } from "../api/inventory.api";

// Se deja sin pedir mientras no haya tienda seleccionada (enabled) — a
// diferencia del resto del dashboard, acá no existe un "todas las
// tiendas" con sentido: el inventario se captura por tienda.
export function useInventoryItems(posConfigId: number | undefined) {
  return useQuery({
    queryKey: ["inventory", "items", posConfigId],
    queryFn: () => fetchInventoryItems(posConfigId as number),
    enabled: posConfigId != null,
  });
}
