"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInventoryMovement } from "../api/inventory-movements.api";
import type { ApiError } from "@/lib/api/client";
import type { CreateInventoryMovementPayload, InventoryMovement } from "../types/inventory-movement.types";

export function useCreateInventoryMovement() {
  const queryClient = useQueryClient();

  return useMutation<InventoryMovement, ApiError, CreateInventoryMovementPayload>({
    mutationFn: createInventoryMovement,
    onSuccess: (movement, variables) => {
      queryClient.setQueryData<InventoryMovement[]>(
        ["inventory", "movements", variables.posConfigId],
        (current) => (current ? [movement, ...current] : [movement]),
      );
      // Si quedó CONFIRMADO de una vez (lo registró Admin/Finanzas), ya
      // afecta estimatedQuantity — invalida el inventario de esa tienda
      // para que el próximo refetch de InventoryTable lo refleje.
      if (movement.status === "CONFIRMADO") {
        queryClient.invalidateQueries({ queryKey: ["inventory", "items", variables.posConfigId] });
      }
    },
  });
}
