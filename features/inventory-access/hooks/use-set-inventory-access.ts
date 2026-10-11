"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setInventoryAccess } from "../api/inventory-access.api";
import type { ApiError } from "@/lib/api/client";
import type { InventoryAccess } from "../types/inventory-access.types";

export function useSetInventoryAccess() {
  const queryClient = useQueryClient();

  return useMutation<InventoryAccess, ApiError, { posConfigId: number; enabled: boolean }>({
    mutationFn: ({ posConfigId, enabled }) => setInventoryAccess(posConfigId, enabled),
    onSuccess: (access) => {
      queryClient.setQueryData<InventoryAccess>(["inventory", "access"], access);
    },
  });
}
