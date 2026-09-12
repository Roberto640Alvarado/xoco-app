"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertWholesaleGoalsBulk } from "../api/wholesale-goals.api";
import type { ApiError } from "@/lib/api/client";
import type { UpsertWholesaleGoalsBulkPayload, WholesaleClientGoal } from "../types/wholesale-goals.types";

export function useUpsertWholesaleGoalsBulk() {
  const queryClient = useQueryClient();

  return useMutation<WholesaleClientGoal[], ApiError, UpsertWholesaleGoalsBulkPayload>({
    mutationFn: upsertWholesaleGoalsBulk,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wholesale-goals", "summary", variables.year, variables.month] });
    },
  });
}
