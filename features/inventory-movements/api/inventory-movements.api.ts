import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  CreateInventoryMovementPayload,
  InventoryMovement,
  InventoryMovementNotifications,
} from "../types/inventory-movement.types";

export function fetchInventoryMovements(posConfigId: number) {
  return apiGet<InventoryMovement[]>(`/inventory/stores/${posConfigId}/movements`);
}

export function createInventoryMovement({ posConfigId, ...dto }: CreateInventoryMovementPayload) {
  return apiPost<InventoryMovement>(`/inventory/stores/${posConfigId}/movements`, dto);
}

export function confirmInventoryMovement(id: string) {
  return apiPatch<InventoryMovement>(`/inventory/movements/${id}/confirm`);
}

// El motivo es obligatorio: lo ve el Vendedor en su seguimiento.
export function rejectInventoryMovement(id: string, reason: string) {
  return apiPatch<InventoryMovement>(`/inventory/movements/${id}/reject`, { reason });
}

// Bandeja de Admin/Finanzas: merma/regalía/degustación abiertas de TODAS las tiendas.
export function fetchMovementsInbox() {
  return apiGet<InventoryMovement[]>("/inventory/movements/inbox");
}

export function fetchMovementNotifications(params: { sinceMovements?: string }) {
  return apiGet<InventoryMovementNotifications>("/inventory/movements/notifications", { params });
}
