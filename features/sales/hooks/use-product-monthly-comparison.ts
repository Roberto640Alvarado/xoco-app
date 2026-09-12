"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductMonthlyComparison } from "../api/sales.api";

export function useProductMonthlyComparison(posConfigId?: number, limit = 10) {
  return useQuery({
    queryKey: ["sales", "product-monthly-comparison", posConfigId, limit],
    queryFn: () => fetchProductMonthlyComparison({ posConfigId, limit }),
  });
}
