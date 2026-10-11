export type InventoryMovementType = "MERMA" | "REGALIA" | "DEGUSTACION" | "ENTRADA";

// Flujo de ENTRADA (solicitud de stock de un Vendedor):
// PENDIENTE (el Vendedor pidió) -> EN_CAMINO (Admin/Finanzas aceptó) ->
// RECIBIDO (el Vendedor marcó que llegó, con la cantidad real) ->
// CONFIRMADO (Admin/Finanzas lo da por bueno y recién ahí se suma al
// stock). Antes de CONFIRMADO se puede pasar a RECHAZADO con motivo.
// Los demás tipos van directo de PENDIENTE a CONFIRMADO/RECHAZADO.
export type InventoryMovementStatus = "PENDIENTE" | "EN_CAMINO" | "RECIBIDO" | "CONFIRMADO" | "RECHAZADO";

// Lo que devuelven POST/GET /inventory/stores/:posConfigId/movements
// (ver InventoryMovementDoc en xoco-api). PENDIENTE solo ocurre cuando lo
// registra un Vendedor — Admin/Finanzas nace CONFIRMADO de inmediato
// (ver InventoryMovementsService.create). Solo movimientos CONFIRMADOS
// afectan estimatedQuantity en el módulo de Inventario — ENTRADA suma,
// los otros tres restan.
export interface InventoryMovement {
  id: string;
  posConfigId: number;
  productId: number;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
  // Solo ENTRADA la usa: la cantidad real que el Vendedor confirmó
  // haber recibido (ver useReceiveInventoryMovement) — puede diferir de
  // `quantity` si no llegó completo. null hasta que se marca RECIBIDO.
  receivedQuantity: number | null;
  note: string | null;
  occurredAt: string;
  status: InventoryMovementStatus;
  registeredByEmail: string;
  registeredByRole: "SUPER_ADMIN" | "FINANZAS" | "VENDEDOR";
  resolvedByEmail: string | null;
  resolvedAt: string | null;
  // Solo ENTRADA: quién/cuándo aceptó la solicitud (pasó a EN_CAMINO).
  acceptedByEmail: string | null;
  acceptedAt: string | null;
  // Motivo con el que Admin/Finanzas rechazó (null si no está rechazado).
  rejectionReason: string | null;
}

export interface CreateInventoryMovementPayload {
  posConfigId: number;
  productId: number;
  type: InventoryMovementType;
  quantity: number;
  note?: string;
}

// Lo que devuelve GET /inventory/movements/notifications (ver
// InventoryMovementNotificationsDoc en xoco-api): un contador por pantalla.
export interface InventoryMovementNotifications {
  total: number;
  /** Globo de Inventario → Movimientos. */
  movements: number;
  /** Globo de Inventario → Solicitudes. */
  requests: number;
}

/** Qué bandeja pide Admin/Finanzas: solicitudes de stock o merma/regalía/degustación. */
export type MovementsInboxKind = "requests" | "movements";
