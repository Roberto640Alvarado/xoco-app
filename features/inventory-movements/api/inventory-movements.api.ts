import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  CreateInventoryMovementPayload,
  InventoryMovement,
  InventoryMovementNotifications,
  MovementsInboxKind,
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

// Solicitud de stock (ENTRADA): Admin/Finanzas la acepta y pasa a EN_CAMINO.
export function acceptInventoryMovement(id: string) {
  return apiPatch<InventoryMovement>(`/inventory/movements/${id}/accept`);
}

// Bandeja de Admin/Finanzas: lo abierto de TODAS las tiendas.
export function fetchMovementsInbox(kind: MovementsInboxKind) {
  return apiGet<InventoryMovement[]>("/inventory/movements/inbox", { params: { kind } });
}

// Exclusivo del flujo ENTRADA: el Vendedor marca que el envío llegó e
// ingresa la cantidad real (puede diferir de lo solicitado) — todavía
// necesita que Admin/Finanzas lo confirme o rechace después.
export function receiveInventoryMovement(id: string, receivedQuantity: number) {
  return apiPatch<InventoryMovement>(`/inventory/movements/${id}/receive`, { receivedQuantity });
}

export function fetchMovementNotifications(params: { sinceMovements?: string; sinceRequests?: string }) {
  return apiGet<InventoryMovementNotifications>("/inventory/movements/notifications", { params });
}
