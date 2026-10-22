import type { PaginationMeta } from "@/types/api";

// Mismo shape que xoco-api/src/sales/doc/pos-tickets.doc.ts
// (PosTicketsService). Fecha y hora ya vienen en hora LOCAL de la tienda.

export interface PosTicketRef {
  id: number;
  name: string;
}

export interface PosTicketSummary {
  id: number;
  name: string;
  posReference: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24 h)
  state: string;
  store: PosTicketRef;
  session: PosTicketRef;
  cashier: PosTicketRef | null;
  customer: PosTicketRef | null;
  lineCount: number;
  unitCount: number;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  amountPaid: number;
  amountReturn: number;
  paymentMethods: string[];
  /** Parte de la orden que es propina (ya incluida arriba). null si no lleva. */
  tip: PosTicketTip | null;
}

export interface PosTicketTip {
  lineCount: number;
  unitCount: number;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
}

export interface PosTicketsTotals {
  orderCount: number;
  totalRevenue: number;
  averageTicket: number;
}

export interface PaginatedPosTickets {
  items: PosTicketSummary[];
  meta: PaginationMeta;
  totals: PosTicketsTotals;
}

export interface PosTicketLine {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  uomName: string | null;
  isWeight: boolean;
  /** Granel: cantidad ya en kg. null si es por pieza. */
  quantityKg: number | null;
  priceUnit: number;
  discount: number;
  subtotal: number;
  total: number;
}

export interface PosTicketPayment {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
}

export interface PosTicketDetail extends PosTicketSummary {
  lines: PosTicketLine[];
  payments: PosTicketPayment[];
}

/** Mismo enum que PosTicketSort en la API. */
export type PosTicketSort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export interface PosTicketsFilters {
  dateFrom: string;
  dateTo: string;
  posConfigId?: number;
  search?: string;
  sort: PosTicketSort;
  page: number; // desde 1, como la API
  limit: number;
}
