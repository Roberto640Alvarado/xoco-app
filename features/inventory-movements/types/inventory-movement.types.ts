// ENTRADA ya no se registra a mano: la crea el sistema (ya CONFIRMADA) cuando
// la tienda confirma una solicitud recibida (Inventario → Solicitudes). Puede
// aparecer en listados históricos, pero no se crea ni resuelve desde aquí.
export type InventoryMovementType = "MERMA" | "REGALIA" | "DEGUSTACION" | "ENTRADA";

// Merma/regalía/degustación: PENDIENTE (lo reportó un Vendedor) ->
// CONFIRMADO o RECHAZADO (con motivo) por Admin/Finanzas. EN_CAMINO y
// RECIBIDO son del flujo viejo de solicitudes y solo existen en datos
// históricos.
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
  // Dato histórico del flujo viejo de solicitudes; no se usa en pantalla nueva.
  receivedQuantity: number | null;
  note: string | null;
  occurredAt: string;
  status: InventoryMovementStatus;
  registeredByEmail: string;
  registeredByRole: "SUPER_ADMIN" | "FINANZAS" | "VENDEDOR";
  resolvedByEmail: string | null;
  resolvedAt: string | null;
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
// InventoryMovementNotificationsDoc en xoco-api).
export interface InventoryMovementNotifications {
  total: number;
  /** Globo de Inventario → Movimientos. */
  movements: number;
}

