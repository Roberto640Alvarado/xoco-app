"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductRankingByCategory } from "../api/sales.api";
import type { CategoryProductMetric, ProductRankOrder, SalesFilters } from "../types/sales.types";

export function useProductRankingByCategory(
  filters: SalesFilters,
  limit = 10,
  order: ProductRankOrder = "desc",
  metric: CategoryProductMetric = "revenue",
) {
  return useQuery({
    queryKey: ["sales", "product-ranking-by-category", filters, limit, order, metric],
    queryFn: () => fetchProductRankingByCategory(filters, limit, order, metric),
  });
}
