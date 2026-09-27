export type InventoryUnit = "unidad" | "kg";

// Un producto del catálogo de Odoo cruzado con lo ya capturado en Mongo
// para una tienda — lo que devuelve GET /inventory/stores/:posConfigId/items.
// quantity=null significa que nadie ha contado ese producto todavía en
// esta tienda (distinto de 0 = "se contó y no hay existencia").
export interface InventoryItem {
  productId: number;
  productName: string;
  unit: InventoryUnit;
  quantity: number | null;
  updatedAt: string | null;
  updatedByEmail: string | null;
}

export interface InventorySavedItem {
  id: string;
  posConfigId: number;
  productId: number;
  quantity: number;
  updatedAt: string;
  updatedByEmail: string | null;
}

export interface UpsertInventoryBulkPayload {
  posConfigId: number;
  entries: Array<{ productId: number; quantity: number }>;
}
