export type StockRequestStatus = "SOLICITADA" | "EN_PREPARACION" | "EN_CAMINO" | "RECIBIDA" | "CANCELADA";

export type StockRequestUnit = "unidad" | "kg";

export type StockRequestRole = "SUPER_ADMIN" | "FINANZAS" | "VENDEDOR" | "PLANTA";

// Lo que devuelve GET /inventory/requests (ver StockRequestDoc en xoco-api).
export interface StockRequestLine {
  productId: number;
  productName: string;
  categoryName: string;
  unit: StockRequestUnit;
  /** Lo que pidió la tienda. 0 en las líneas que agregó planta. */
  requestedQuantity: number;
  /** null = planta todavía no responde; 0 = no hay. */
  sentQuantity: number | null;
  /** null hasta que la tienda confirma la recepción. */
  receivedQuantity: number | null;
  /** Recibido menos enviado (columna DIF del formato). */
  difference: number | null;
  addedByPlant: boolean;
  /** Solo en líneas agregadas por planta: el producto pedido al que sustituye ("en lugar de"). */
  replacesProductId: number | null;
  plantNote: string | null;
  storeNote: string | null;
}

export interface StockRequestEvent {
  status: StockRequestStatus;
  at: string;
  byEmail: string;
  byRole: StockRequestRole;
  note: string | null;
}

export interface StockRequest {
  id: string;
  number: number;
  /** "SOL-0012": el Número de Requisición del formato. */
  code: string;
  posConfigId: number;
  storeName: string;
  status: StockRequestStatus;
  note: string | null;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
  dispatchedAt: string | null;
  receivedAt: string | null;
  dispatch: "COMPLETO" | "PARCIAL" | null;
  cancelReason: string | null;
  lines: StockRequestLine[];
  events: StockRequestEvent[];
}

export interface StockRequestCatalogItem {
  productId: number;
  productName: string;
  categoryName: string;
  unit: StockRequestUnit;
}

export interface StockRequestNotifications {
  pending: number;
}

export interface StockRequestFilters {
  status?: StockRequestStatus;
  posConfigId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateStockRequestPayload {
  /** Solo cuando pide el Admin: la tienda elegida (el Vendedor siempre pide para la suya). */
  posConfigId?: number;
  note?: string;
  lines: { productId: number; quantity: number }[];
}

export interface PlantLinePayload {
  productId: number;
  sentQuantity: number | null;
  note?: string | null;
  added?: boolean;
  /** Producto pedido al que sustituye (solo con `added`). */
  replacesProductId?: number | null;
}

export interface SavePlantResponsePayload {
  note?: string;
  lines: PlantLinePayload[];
}

export interface ReceiveStockRequestPayload {
  note?: string;
  lines: { productId: number; receivedQuantity: number; note?: string }[];
}
