"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmInventoryMovement, rejectInventoryMovement } from "../api/inventory-movements.api";
import type { ApiError } from "@/lib/api/client";
import type { InventoryMovement } from "../types/inventory-movement.types";

// Confirmar/rechazar (con motivo) un movimiento abierto reportado por un Vendedor
// (solo Admin/Finanzas, ver @Roles en InventoryMovementsController). Un
// mismo hook para las dos acciones porque comparten la misma respuesta e
// invalidan la misma cache — la acción (`"confirm" | "reject"`) decide
// solo qué endpoint llamar.
export function useResolveInventoryMovement() {
  const queryClient = useQueryClient();

  return useMutation<InventoryMovement, ApiError, { id: string; action: "confirm" | "reject"; reason?: string }>({
    mutationFn: ({ id, action, reason }) =>
      action === "confirm" ? confirmInventoryMovement(id) : rejectInventoryMovement(id, reason ?? ""),
    onSuccess: (movement) => {
      queryClient.setQueryData<InventoryMovement[]>(
        ["inventory", "movements", movement.posConfigId],
        (current) => current?.map((item) => (item.id === movement.id ? movement : item)),
      );
      // Confirmar un movimiento de Vendedor recién ahora lo resta de
      // estimatedQuantity — rechazar uno no cambia nada ahí, pero
      // invalidar en ambos casos es más simple que distinguir.
      queryClient.invalidateQueries({ queryKey: ["inventory", "items", movement.posConfigId] });
      // El aviso del menú (globo de Movimientos) cambia con cada alta o
      // cambio de estado.
      queryClient.invalidateQueries({ queryKey: ["inventory", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "inbox"] });
    },
  });
}
