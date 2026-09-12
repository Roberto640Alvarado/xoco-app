"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductRankingByWeight } from "../api/sales.api";
import type { ProductRankOrder, SalesFilters } from "../types/sales.types";

export function useProductRankingByWeight(
  filters: SalesFilters,
  limit = 10,
  order: ProductRankOrder = "desc",
) {
  return useQuery({
    queryKey: ["sales", "product-ranking-by-weight", filters, limit, order],
    queryFn: () => fetchProductRankingByWeight(filters, limit, order),
  });
}
