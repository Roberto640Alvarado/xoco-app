export type InventoryLedgerEntryType = "VENTA" | "MERMA" | "REGALIA" | "DEGUSTACION" | "ENTRADA" | "TRASLADO" | "CONTEO";

// IN suma a la existencia (entrada), OUT resta (venta, merma, regalía,
// degustación), COUNT es un conteo físico que fija la cantidad.
export type InventoryLedgerDirection = "IN" | "OUT" | "COUNT";

// Una línea de GET /inventory/stores/:posConfigId/ledger (ver
// InventoryLedgerEntryDoc en xoco-api).
export interface InventoryLedgerEntry {
  id: string;
  occurredAt: string;
  type: InventoryLedgerEntryType;
  direction: InventoryLedgerDirection;
  productId: number;
  productName: string;
  quantity: number;
  status: "PENDIENTE" | "EN_CAMINO" | "RECIBIDO" | "CONFIRMADO" | "RECHAZADO" | null;
  detail: string | null;
  registeredBy: string | null;
}

export interface InventoryLedgerFilters {
  posConfigId: number;
  dateFrom: string;
  dateTo: string;
  productId?: number;
  type?: InventoryLedgerEntryType;
}
