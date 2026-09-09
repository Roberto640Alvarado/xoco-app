"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTicketGoalsSummary } from "../api/ticket-goals.api";
import type { ApiError } from "@/lib/api/client";
import type { TicketGoalSummaryItem } from "../types/ticket-goals.types";

export function useTicketGoalsSummary(year: number, month: number) {
  return useQuery<TicketGoalSummaryItem[], ApiError>({
    queryKey: ["ticket-goals", "summary", year, month],
    queryFn: () => fetchTicketGoalsSummary(year, month),
  });
}
