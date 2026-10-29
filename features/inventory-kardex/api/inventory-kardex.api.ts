import { apiGet } from "@/lib/api/client";
import type { Kardex, KardexFilters } from "../types/inventory-kardex.types";

export function fetchInventoryKardex({ posConfigId, ...params }: KardexFilters) {
  return apiGet<Kardex>(`/inventory/stores/${posConfigId}/kardex`, { params });
}
