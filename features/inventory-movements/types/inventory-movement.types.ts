export type InventoryMovementType = "MERMA" | "REGALIA" | "DEGUSTACION" | "ENTRADA";

// RECIBIDO es exclusivo del flujo de ENTRADA solicitada por un Vendedor:
// PENDIENTE (el Vendedor pidió el envío) -> RECIBIDO (el Vendedor marcó
// que ya llegó e ingresó la cantidad real) -> CONFIRMADO/RECHAZADO
// (Admin o Finanzas cierra el ciclo). Los demás tipos nunca pasan por
// RECIBIDO.
export type InventoryMovementStatus = "PENDIENTE" | "RECIBIDO" | "CONFIRMADO" | "RECHAZADO";

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
}

export interface CreateInventoryMovementPayload {
  posConfigId: number;
  productId: number;
  type: InventoryMovementType;
  quantity: number;
  note?: string;
}
