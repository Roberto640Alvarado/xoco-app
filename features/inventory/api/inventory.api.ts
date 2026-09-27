import { apiClient, apiGet } from "@/lib/api/client";
import type { InventoryItem, InventorySavedItem, UpsertInventoryBulkPayload } from "../types/inventory.types";

export function fetchInventoryItems(posConfigId: number) {
  return apiGet<InventoryItem[]>(`/inventory/stores/${posConfigId}/items`);
}

// El backend expone PUT /inventory/stores/:posConfigId/items (lote) — no
// hay helper apiPut en lib/api/client.ts todavía (mismo caso que
// features/goals), se usa apiClient directo.
export function upsertInventoryBulk({ posConfigId, entries }: UpsertInventoryBulkPayload) {
  return apiClient
    .put<InventorySavedItem[]>(`/inventory/stores/${posConfigId}/items`, { entries })
    .then((res) => res.data);
}
