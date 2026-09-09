"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertTicketGoalsBulk } from "../api/ticket-goals.api";
import type { ApiError } from "@/lib/api/client";
import type { StoreTicketGoal, UpsertTicketGoalsBulkPayload } from "../types/ticket-goals.types";

export function useUpsertTicketGoalsBulk() {
  const queryClient = useQueryClient();

  return useMutation<StoreTicketGoal[], ApiError, UpsertTicketGoalsBulkPayload>({
    mutationFn: upsertTicketGoalsBulk,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-goals", "summary", variables.year, variables.month] });
    },
  });
}
