"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductRankingByCategory } from "../api/sales.api";
import type { ProductRankOrder, SalesFilters } from "../types/sales.types";

export function useProductRankingByCategory(
  filters: SalesFilters,
  limit = 10,
  order: ProductRankOrder = "desc",
) {
  return useQuery({
    queryKey: ["sales", "product-ranking-by-category", filters, limit, order],
    queryFn: () => fetchProductRankingByCategory(filters, limit, order),
  });
}
