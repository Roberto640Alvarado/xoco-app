"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertGoalsBulk } from "../api/goals.api";
import type { ApiError } from "@/lib/api/client";
import type { StoreGoal, UpsertGoalsBulkPayload } from "../types/goals.types";

export function useUpsertGoalsBulk() {
  const queryClient = useQueryClient();

  return useMutation<StoreGoal[], ApiError, UpsertGoalsBulkPayload>({
    mutationFn: upsertGoalsBulk,
    onSuccess: (_data, variables) => {
      // Se invalida en vez de escribir el cache a mano: el % guardado
      // cambia Meta/Alcance/Proyección, que el backend recalcula — más
      // simple volver a pedir el resumen completo que reconstruirlo acá.
      queryClient.invalidateQueries({ queryKey: ["goals", "summary", variables.year, variables.month] });
    },
  });
}
