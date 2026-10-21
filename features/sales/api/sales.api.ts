import { apiGet } from "@/lib/api/client";
import type {
  CategoryProductMetric,
  CategoryTopProducts,
  CustomerSearchFilters,
  CustomerSearchResult,
  DailySalesPoint,
  PaymentMethodsSummary,
  ProductComparison,
  ProductComparisonPeriods,
  ProductRankOrder,
  SalesFilters,
  Store,
  TopProduct,
  TopProductByWeight,
} from "../types/sales.types";

function toQueryString(
  filters: SalesFilters & { limit?: number; order?: ProductRankOrder; metric?: CategoryProductMetric },
): string {
  const params = new URLSearchParams({ dateFrom: filters.dateFrom, dateTo: filters.dateTo });
  if (filters.posConfigId) params.set("posConfigId", String(filters.posConfigId));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.order) params.set("order", filters.order);
  if (filters.metric) params.set("metric", filters.metric);
  return params.toString();
}

export function fetchStores() {
  return apiGet<Store[]>("/sales/stores");
}

export function fetchDailySummary(filters: SalesFilters) {
  return apiGet<DailySalesPoint[]>(`/sales/daily-summary?${toQueryString(filters)}`);
}

export function fetchProductRanking(filters: SalesFilters, limit = 10, order: ProductRankOrder = "desc") {
  return apiGet<TopProduct[]>(`/sales/top-products?${toQueryString({ ...filters, limit, order })}`);
}

export function fetchProductRankingByWeight(
  filters: SalesFilters,
  limit = 10,
  order: ProductRankOrder = "desc",
) {
  return apiGet<TopProductByWeight[]>(
    `/sales/top-products-by-weight?${toQueryString({ ...filters, limit, order })}`,
  );
}

export function fetchProductRankingByCategory(
  filters: SalesFilters,
  limit = 10,
  order: ProductRankOrder = "desc",
  metric: CategoryProductMetric = "revenue",
) {
  return apiGet<CategoryTopProducts[]>(
    `/sales/top-products-by-category?${toQueryString({ ...filters, limit, order, metric })}`,
  );
}

export function fetchPaymentMethodsSummary(filters: SalesFilters) {
  return apiGet<PaymentMethodsSummary>(`/sales/payment-methods?${toQueryString(filters)}`);
}

export function fetchCustomerSearch(filters: CustomerSearchFilters) {
  const params = new URLSearchParams({ q: filters.q, dateFrom: filters.dateFrom });
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.limit) params.set("limit", String(filters.limit));
  return apiGet<CustomerSearchResult[]>(`/sales/customers/search?${params.toString()}`);
}

// Dos períodos libres (A = principal, B = contra el que se compara) — ver
// SalesService.findProductComparison. Para un Vendedor la API ignora
// posConfigId y usa siempre su propia tienda.
export function fetchProductComparison(periods: ProductComparisonPeriods, posConfigId?: number) {
  const query = new URLSearchParams({
    periodAFrom: periods.a.dateFrom,
    periodATo: periods.a.dateTo,
    periodBFrom: periods.b.dateFrom,
    periodBTo: periods.b.dateTo,
  });
  if (posConfigId) query.set("posConfigId", String(posConfigId));
  return apiGet<ProductComparison>(`/sales/product-comparison?${query.toString()}`);
}
