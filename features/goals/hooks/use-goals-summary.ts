"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchGoalsSummary } from "../api/goals.api";

export function useGoalsSummary(year: number, month: number) {
  return useQuery({
    queryKey: ["goals", "summary", year, month],
    queryFn: () => fetchGoalsSummary(year, month),
  });
}
