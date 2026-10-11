"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setInventoryAccess } from "../api/inventory-access.api";
import type { ApiError } from "@/lib/api/client";

interface SetAllInventoryAccessVariables {
  posConfigIds: number[];
  enabled: boolean;
}

// Habilita u oculta Inventario en varias tiendas de una vez. El backend
// maneja una tienda por llamada, así que se hacen una tras otra (no en
// paralelo: cada respuesta devuelve el conjunto completo) y al final se
// recarga el estado.
export function useSetAllInventoryAccess() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, SetAllInventoryAccessVariables>({
    mutationFn: async ({ posConfigIds, enabled }) => {
      for (const posConfigId of posConfigIds) {
        await setInventoryAccess(posConfigId, enabled);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["inventory", "access"] }),
  });
}
