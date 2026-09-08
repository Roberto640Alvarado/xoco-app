"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductRanking } from "../api/sales.api";
import type { ProductRankOrder, SalesFilters } from "../types/sales.types";

export function useProductRanking(filters: SalesFilters, limit = 10, order: ProductRankOrder = "desc") {
  return useQuery({
    queryKey: ["sales", "product-ranking", filters, limit, order],
    queryFn: () => fetchProductRanking(filters, limit, order),
  });
}
