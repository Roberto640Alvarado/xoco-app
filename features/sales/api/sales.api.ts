import { apiGet } from "@/lib/api/client";
import type {
  DailySalesPoint,
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
