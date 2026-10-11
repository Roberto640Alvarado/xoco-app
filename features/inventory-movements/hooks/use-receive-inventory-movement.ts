"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { receiveInventoryMovement } from "../api/inventory-movements.api";
import type { ApiError } from "@/lib/api/client";
import type { InventoryMovement } from "../types/inventory-movement.types";

// Mismo criterio de cache que useResolveInventoryMovement — actualiza la
// fila en el listado de la tienda (no invalida estimatedQuantity: RECIBIDO
// todavía no afecta el inventario, solo CONFIRMADO lo hace).
export function useReceiveInventoryMovement() {
  const queryClient = useQueryClient();

  return useMutation<InventoryMovement, ApiError, { id: string; receivedQuantity: number }>({
    mutationFn: ({ id, receivedQuantity }) => receiveInventoryMovement(id, receivedQuantity),
    onSuccess: (movement) => {
      queryClient.setQueryData<InventoryMovement[]>(
        ["inventory", "movements", movement.posConfigId],
        (current) => current?.map((item) => (item.id === movement.id ? movement : item)),
      );
    },
  });
}
