"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInventoryKardex } from "../api/inventory-kardex.api";
import type { KardexFilters } from "../types/inventory-kardex.types";

// Se genera solo al elegir tienda y rango, como el resto del dashboard.
export function useInventoryKardex(filters: KardexFilters | undefined) {
  return useQuery({
    queryKey: ["inventory", "kardex", filters],
    queryFn: () => fetchInventoryKardex(filters as KardexFilters),
    enabled: filters != null,
  });
}
