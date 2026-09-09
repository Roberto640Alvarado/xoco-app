"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSalesGoalsSummary } from "../api/sales-goals.api";
import type { ApiError } from "@/lib/api/client";
import type { SalesGoalSummaryItem } from "../types/sales-goals.types";

export function useSalesGoalsSummary(year: number, month: number) {
  return useQuery<SalesGoalSummaryItem[], ApiError>({
    queryKey: ["sales-goals", "summary", year, month],
    queryFn: () => fetchSalesGoalsSummary(year, month),
  });
}
