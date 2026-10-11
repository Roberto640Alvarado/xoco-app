export type InventoryMovementType = "MERMA" | "REGALIA" | "DEGUSTACION";

export type InventoryMovementStatus = "PENDIENTE" | "CONFIRMADO" | "RECHAZADO";

// Lo que devuelven POST/GET /inventory/stores/:posConfigId/movements
// (ver InventoryMovementDoc en xoco-api). PENDIENTE solo ocurre cuando lo
// registra un Vendedor — Admin/Finanzas nace CONFIRMADO de inmediato
// (ver InventoryMovementsService.create). Solo movimientos CONFIRMADOS
// se restan de estimatedQuantity en el módulo de Inventario.
export interface InventoryMovement {
  id: string;
  posConfigId: number;
  productId: number;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
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
