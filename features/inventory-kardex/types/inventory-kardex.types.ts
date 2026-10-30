// Lo que devuelve GET /inventory/stores/:id/kardex (ver InventoryKardexDoc en xoco-api).

export type KardexUnit = "unidad" | "kg";

export type KardexEntryType = "VENTA" | "MERMA" | "REGALIA" | "DEGUSTACION" | "ENTRADA" | "TRASLADO" | "CONTEO";

export interface KardexRow {
  occurredAt: string;
  /** Día local de la tienda, YYYY-MM-DD. */
  storeDate: string;
  type: KardexEntryType;
  concept: string;
  reference: string | null;
  registeredBy: string | null;
  quantityIn: number;
  quantityOut: number;
  /** Solo en conteos: contado menos el saldo que había (null si no había saldo). */
  adjustment: number | null;
  /** null mientras el producto no tenga un conteo de partida. */
  balance: number | null;
}

export interface KardexProduct {
  productId: number;
  productName: string;
  categoryName: string;
  unit: KardexUnit;
  openingBalance: number | null;
  totalIn: number;
  totalOut: number;
  totalAdjustment: number;
  closingBalance: number | null;
  rows: KardexRow[];
}

export interface Kardex {
  posConfigId: number;
  storeName: string;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  products: KardexProduct[];
}

export interface KardexFilters {
  posConfigId: number;
  dateFrom: string;
  dateTo: string;
}
