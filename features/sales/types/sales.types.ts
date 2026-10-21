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

// Ranking aparte para productos a granel (ej. "Crocks") — su cantidad ya
// viene convertida a kilogramos, nunca en la UoM cruda de Odoo.
export interface TopProductByWeight {
  productId: number;
  productName: string;
  totalKg: number;
  totalRevenue: number;
}

// Comparación de productos entre dos períodos libres — mismo shape que
// ProductComparisonDoc en xoco-api (SalesService.findProductComparison).
// "A" es el período principal y "B" contra el que se compara.
export interface ComparisonPeriodRange {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
}

export interface ProductComparisonPeriods {
  a: ComparisonPeriodRange;
  b: ComparisonPeriodRange;
}

export interface ProductComparisonPeriodTotals extends ComparisonPeriodRange {
  quantity: number;
  revenue: number;
  productCount: number;
}

export interface ProductComparisonValues {
  quantity: number;
  revenue: number;
}

export interface ProductComparisonItem {
  productId: number;
  productName: string;
  periodA: ProductComparisonValues;
  periodB: ProductComparisonValues;
}

export interface ProductComparison {
  periodA: ProductComparisonPeriodTotals;
  periodB: ProductComparisonPeriodTotals;
  items: ProductComparisonItem[];
}

/** Qué se grafica y con qué se mide el cambio: unidades o ingresos ($). */
export type ProductComparisonMetric = "quantity" | "revenue";

/** Orden de la gráfica y la tabla (se calcula en el cliente, sin volver a pedir datos). */
export type ProductComparisonSort = "periodA" | "growth" | "decline";

// "kg" para productos a granel (ej. Crocks); "unidad" para el resto — ver
// SalesService.findTopProductsByCategory en xoco-api. `quantity` viene en
// esa unidad, así que NO es comparable entre un producto con `unit`
// distinto (0.5 kg vs. 2 unidades no se pueden sumar/comparar).
export type CategoryProductUnit = "unidad" | "kg";

// Qué campo usa /sales/top-products-by-category para ordenar los
// PRODUCTOS dentro de cada categoría — "revenue" (default) es comparable
// entre pieza y granel; "quantity" no mezcla ambos tipos pero tampoco los
// compara entre sí (ver CategoryProductUnit). Las categorías siempre se
// ordenan por ingresos, sin importar este valor.
export type CategoryProductMetric = "revenue" | "quantity";

// Un producto dentro del top de su categoría — ver
// /sales/top-products-by-category. A diferencia de TopProduct, acá SÍ
// conviven productos por pieza y a granel (ej. "Crocks") en el mismo
// ranking, porque además de `quantity` (en su propia unidad) siempre trae
// `revenue` ($), que es comparable entre ambos tipos.
export interface CategoryProduct {
  productId: number;
  productName: string;
  revenue: number;
  quantity: number;
  unit: CategoryProductUnit;
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
