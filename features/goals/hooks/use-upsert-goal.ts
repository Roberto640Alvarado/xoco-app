"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertGoal } from "../api/goals.api";
import type { ApiError } from "@/lib/api/client";
import type { StoreGoal, UpsertGoalPayload } from "../types/goals.types";

export function useUpsertGoal() {
  const queryClient = useQueryClient();

  return useMutation<StoreGoal, ApiError, UpsertGoalPayload>({
    mutationFn: upsertGoal,
    onSuccess: (_data, variables) => {
      // Se invalida en vez de escribir el cache a mano: la meta guardada
      // cambia Alcance/Proyección, que el backend recalcula — más simple
      // volver a pedir el resumen completo que reconstruirlo en el cliente.
      queryClient.invalidateQueries({ queryKey: ["goals", "summary", variables.year, variables.month] });
    },
  });
}
