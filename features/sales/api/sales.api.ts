import { apiGet } from "@/lib/api/client";
import type {
  CategoryTopProducts,
  CustomerSearchFilters,
  CustomerSearchResult,
  DailySalesPoint,
  PaymentMethodsSummary,
  ProductMonthlyComparison,
  ProductRankOrder,
  SalesFilters,
  Store,
  TopProduct,
  TopProductByWeight,
} from "../types/sales.types";

function toQueryString(
  filters: SalesFilters & { limit?: number; order?: ProductRankOrder },
): string {
  const params = new URLSearchParams({ dateFrom: filters.dateFrom, dateTo: filters.dateTo });
  if (filters.posConfigId) params.set("posConfigId", String(filters.posConfigId));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.order) params.set("order", filters.order);
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
) {
  return apiGet<CategoryTopProducts[]>(
    `/sales/top-products-by-category?${toQueryString({ ...filters, limit, order })}`,
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

// No toma rango de fechas: el backend siempre compara el mes en curso
// (día 1 a hoy) contra el mes anterior completo — ver
// SalesService.findProductMonthlyComparison.
export function fetchProductMonthlyComparison(params: { posConfigId?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.posConfigId) query.set("posConfigId", String(params.posConfigId));
  if (params.limit) query.set("limit", String(params.limit));
  return apiGet<ProductMonthlyComparison[]>(`/sales/product-monthly-comparison?${query.toString()}`);
}
