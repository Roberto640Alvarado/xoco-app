import { apiGet } from "@/lib/api/client";
import type {
  CategoryTopProducts,
  CustomerSearchFilters,
  CustomerSearchResult,
  DailySalesPoint,
  PaymentMethodsSummary,
  ProductRankOrder,
  SalesFilters,
  Store,
  TopProduct,
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
