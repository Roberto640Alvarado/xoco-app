import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { CreateInventoryMovementPayload, InventoryMovement, InventoryMovementNotifications } from "../types/inventory-movement.types";

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

// Exclusivo del flujo ENTRADA: el Vendedor marca que el envío llegó e
// ingresa la cantidad real (puede diferir de lo solicitado) — todavía
// necesita que Admin/Finanzas lo confirme o rechace después.
export function receiveInventoryMovement(id: string, receivedQuantity: number) {
  return apiPatch<InventoryMovement>(`/inventory/movements/${id}/receive`, { receivedQuantity });
}

export function fetchMovementNotifications(since?: string) {
  return apiGet<InventoryMovementNotifications>("/inventory/movements/notifications", since ? { params: { since } } : undefined);
}
