"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary } from "../api/sales.api";
import type { SalesFilters } from "../types/sales.types";

export function useDailySummary(filters: SalesFilters) {
  return useQuery({
    queryKey: ["sales", "daily-summary", filters],
    queryFn: () => fetchDailySummary(filters),
  });
}
