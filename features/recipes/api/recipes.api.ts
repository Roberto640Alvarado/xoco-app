import { apiClient, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Recipe, RecipeCatalogItem, UpsertRecipePayload } from "../types/recipes.types";

export function fetchRecipeCatalog() {
  return apiGet<RecipeCatalogItem[]>("/inventory/recipes/catalog");
}

export function fetchRecipes(posConfigId: number) {
  return apiGet<Recipe[]>("/inventory/recipes", { params: { posConfigId } });
}

export function saveRecipe(posConfigId: number, productId: number, payload: UpsertRecipePayload) {
  return apiPut<Recipe>(`/inventory/recipes/${posConfigId}/${productId}`, payload);
}

export function deleteRecipe(posConfigId: number, productId: number) {
  // No hay helper apiDelete en client.ts (mismo criterio que inventory-access.api.ts).
  return apiClient.delete(`/inventory/recipes/${posConfigId}/${productId}`).then((res) => res.data);
}

export function copyRecipes(posConfigId: number, sourcePosConfigId: number) {
  return apiPost<Recipe[]>(`/inventory/recipes/${posConfigId}/copy-from/${sourcePosConfigId}`);
}
