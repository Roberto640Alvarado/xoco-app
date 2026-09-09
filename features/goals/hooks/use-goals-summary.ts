"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchGoalsSummary } from "../api/goals.api";
import type { ApiError } from "@/lib/api/client";
import type { GoalSummaryItem } from "../types/goals.types";

export function useGoalsSummary(year: number, month: number) {
  return useQuery<GoalSummaryItem[], ApiError>({
    queryKey: ["goals", "summary", year, month],
    queryFn: () => fetchGoalsSummary(year, month),
  });
}
