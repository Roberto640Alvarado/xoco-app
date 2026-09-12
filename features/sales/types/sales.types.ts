export interface Store {
  id: number;
  name: string;
}

export interface DailySalesPoint {
  date: string; // YYYY-MM-DD
  orderCount: number;
  totalRevenue: number;
  totalTax: number;
}

export type ProductRankOrder = "desc" | "asc";

export interface TopProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

// Un producto dentro del top de su categoría — ver
// /sales/top-products-by-category. Ordenado por ingresos ($), no por
// unidades: a diferencia de TopProduct, acá SÍ conviven productos por
// pieza y a granel (ej. "Crocks") en el mismo ranking.
export interface CategoryProduct {
  productId: number;
  productName: string;
  revenue: number;
}

export interface CategoryTopProducts {
  categoryId: number;
  categoryName: string;
  products: CategoryProduct[];
}

// Un comprador (cualquier partner de Odoo con facturas), resultado del
// buscador general — ver /sales/customers/search. No está limitado a los
// clientes de mayoreo fijos (ver WholesaleClientTotals): puede ser una
// sucursal de una cadena, un cliente natural, lo que sea que tenga
// facturas en el rango.
export interface CustomerSearchResult {
  partnerId: number;
  partnerName: string;
  commercialPartnerId: number;
  commercialPartnerName: string;
  visits: number;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
}

export interface CustomerSearchFilters {
  q: string;
  dateFrom: string;
  dateTo?: string;
  limit?: number;
}

// Desglose de venta por método de pago — ver /sales/payment-methods.
// `cash`/`other` son los 2 baldes (Efectivo vs. todo lo demás, según
// pos.payment.method.type de Odoo); `methods` trae el detalle completo
// por si se quiere ver más allá de las 2 categorías.
export interface PaymentMethodBucket {
  paymentCount: number;
  amountTotal: number;
}

export interface PaymentMethodTotals {
  paymentMethodId: number;
  paymentMethodName: string;
  type: string;
  paymentCount: number;
  amountTotal: number;
}

export interface PaymentMethodsSummary {
  cash: PaymentMethodBucket;
  other: PaymentMethodBucket;
  total: PaymentMethodBucket;
  methods: PaymentMethodTotals[];
}

export interface SalesFilters {
  dateFrom: string;
  dateTo: string;
  posConfigId?: number;
}
