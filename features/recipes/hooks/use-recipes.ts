"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api/client";
import { copyRecipes, deleteRecipe, fetchRecipeCatalog, fetchRecipes, saveRecipe } from "../api/recipes.api";
import type { Recipe, UpsertRecipePayload } from "../types/recipes.types";

export function useRecipeCatalog() {
  return useQuery({ queryKey: ["recipes", "catalog"], queryFn: fetchRecipeCatalog, staleTime: 60_000 });
}

export function useRecipes(posConfigId: number | undefined) {
  return useQuery({
    queryKey: ["recipes", posConfigId],
    queryFn: () => fetchRecipes(posConfigId as number),
    enabled: posConfigId !== undefined,
  });
}

// Una receta cambia la existencia estimada, el Registro y el Kardex de la
// tienda: se invalida todo Inventario para que se vuelva a calcular.
function useInvalidate() {
  const queryClient = useQueryClient();
  return (posConfigId: number) => {
    void queryClient.invalidateQueries({ queryKey: ["recipes", posConfigId] });
    void queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };
}

export function useSaveRecipe() {
  const invalidate = useInvalidate();
  return useMutation<Recipe, ApiError, { posConfigId: number; productId: number; payload: UpsertRecipePayload }>({
    mutationFn: ({ posConfigId, productId, payload }) => saveRecipe(posConfigId, productId, payload),
    onSuccess: (_data, { posConfigId }) => invalidate(posConfigId),
  });
}

export function useDeleteRecipe() {
  const invalidate = useInvalidate();
  return useMutation<unknown, ApiError, { posConfigId: number; productId: number }>({
    mutationFn: ({ posConfigId, productId }) => deleteRecipe(posConfigId, productId),
    onSuccess: (_data, { posConfigId }) => invalidate(posConfigId),
  });
}

export function useCopyRecipes() {
  const invalidate = useInvalidate();
  return useMutation<Recipe[], ApiError, { posConfigId: number; sourcePosConfigId: number }>({
    mutationFn: ({ posConfigId, sourcePosConfigId }) => copyRecipes(posConfigId, sourcePosConfigId),
    onSuccess: (_data, { posConfigId }) => invalidate(posConfigId),
  });
}
