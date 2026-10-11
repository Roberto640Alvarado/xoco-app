"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInventoryMovement } from "../api/inventory-movements.api";
import type { ApiError } from "@/lib/api/client";
import type { InventoryMovement } from "../types/inventory-movement.types";

// Admin/Finanzas acepta una solicitud de stock: pasa a EN_CAMINO. Todavía
// no suma al stock (eso pasa al confirmar la recepción), por eso no
// invalida el inventario de la tienda.
export function useAcceptInventoryMovement() {
  const queryClient = useQueryClient();

  return useMutation<InventoryMovement, ApiError, { id: string }>({
    mutationFn: ({ id }) => acceptInventoryMovement(id),
    onSuccess: (movement) => {
      queryClient.setQueryData<InventoryMovement[]>(
        ["inventory", "movements", movement.posConfigId],
        (current) => current?.map((item) => (item.id === movement.id ? movement : item)),
      );
      queryClient.invalidateQueries({ queryKey: ["inventory", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "inbox"] });
    },
  });
}
