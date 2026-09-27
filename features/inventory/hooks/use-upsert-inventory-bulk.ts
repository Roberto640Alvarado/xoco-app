"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertInventoryBulk } from "../api/inventory.api";
import type { ApiError } from "@/lib/api/client";
import type { InventorySavedItem, UpsertInventoryBulkPayload } from "../types/inventory.types";

export function useUpsertInventoryBulk() {
  const queryClient = useQueryClient();

  return useMutation<InventorySavedItem[], ApiError, UpsertInventoryBulkPayload>({
    mutationFn: upsertInventoryBulk,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "items", variables.posConfigId] });
    },
  });
}
