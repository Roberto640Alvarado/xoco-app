import { apiClient, apiGet } from "@/lib/api/client";
import type { InventoryAccess } from "../types/inventory-access.types";

export function fetchInventoryAccess() {
  return apiGet<InventoryAccess>("/inventory/access");
}

export function setInventoryAccess(posConfigId: number, enabled: boolean) {
  // No hay helper apiPut en client.ts (mismo criterio que goals.api.ts).
  return apiClient.put<InventoryAccess>(`/inventory/access/${posConfigId}`, { enabled }).then((res) => res.data);
}
