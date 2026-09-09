"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertSalesGoalsBulk } from "../api/sales-goals.api";
import type { ApiError } from "@/lib/api/client";
import type { StoreSalesGoal, UpsertSalesGoalsBulkPayload } from "../types/sales-goals.types";

export function useUpsertSalesGoalsBulk() {
  const queryClient = useQueryClient();

  return useMutation<StoreSalesGoal[], ApiError, UpsertSalesGoalsBulkPayload>({
    mutationFn: upsertSalesGoalsBulk,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales-goals", "summary", variables.year, variables.month] });
    },
  });
}
