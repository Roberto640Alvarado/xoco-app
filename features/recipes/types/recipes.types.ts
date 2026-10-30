// Administración → Recetas (ver RecipeDoc en xoco-api).

export type RecipeUnit = "unidad" | "kg";

export interface RecipeComponent {
  productId: number;
  productName: string;
  unit: RecipeUnit;
  /** Cuánto se gasta por cada unidad vendida. */
  quantity: number;
}

export interface Recipe {
  posConfigId: number;
  productId: number;
  productName: string;
  components: RecipeComponent[];
  updatedByEmail: string;
  updatedAt: string;
}

export interface RecipeCatalogItem {
  productId: number;
  productName: string;
  categoryName: string;
  unit: RecipeUnit;
}

export interface UpsertRecipePayload {
  components: { productId: number; quantity: number }[];
}
