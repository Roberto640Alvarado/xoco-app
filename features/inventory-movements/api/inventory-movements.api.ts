import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { CreateInventoryMovementPayload, InventoryMovement } from "../types/inventory-movement.types";

export function fetchInventoryMovements(posConfigId: number) {
  return apiGet<InventoryMovement[]>(`/inventory/stores/${posConfigId}/movements`);
}

export function createInventoryMovement({ posConfigId, ...dto }: CreateInventoryMovementPayload) {
  return apiPost<InventoryMovement>(`/inventory/stores/${posConfigId}/movements`, dto);
}

export function confirmInventoryMovement(id: string) {
  return apiPatch<InventoryMovement>(`/inventory/movements/${id}/confirm`);
}

export function rejectInventoryMovement(id: string) {
  return apiPatch<InventoryMovement>(`/inventory/movements/${id}/reject`);
}
