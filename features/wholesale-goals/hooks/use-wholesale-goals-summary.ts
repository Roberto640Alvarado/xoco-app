"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWholesaleGoalsSummary } from "../api/wholesale-goals.api";
import type { ApiError } from "@/lib/api/client";
import type { WholesaleGoalSummaryItem } from "../types/wholesale-goals.types";

export function useWholesaleGoalsSummary(year: number, month: number) {
  return useQuery<WholesaleGoalSummaryItem[], ApiError>({
    queryKey: ["wholesale-goals", "summary", year, month],
    queryFn: () => fetchWholesaleGoalsSummary(year, month),
  });
}
