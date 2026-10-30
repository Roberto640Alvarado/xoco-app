"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChefHat, Coffee, Loader2, PackageMinus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpSteps } from "@/design-system/components/help-steps";
import { PreviewSheet } from "@/design-system/components/preview-sheet";
import { QuantityStepper } from "@/design-system/components/quantity-stepper";
import { formatKg } from "@/lib/format";
import { useSaveRecipe } from "../hooks/use-recipes";
import { ProductSearch } from "./product-search";
import type { Recipe, RecipeCatalogItem, RecipeUnit } from "../types/recipes.types";

interface Ingredient {
  productId: number;
  productName: string;
  unit: RecipeUnit;
  quantity: number | null;
}

interface RecipeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posConfigId: number;
  storeName: string;
  /** null = receta nueva. */
  recipe: Recipe | null;
  catalog: RecipeCatalogItem[];
  catalogLoading: boolean;
  /** Recetas que ya tiene la tienda (para no repetir ni anidar). */
  existing: Recipe[];
}

const HELP = [
  { icon: Coffee, title: "¿Qué se vende?", text: "El producto del POS, ej. Americano." },
  { icon: PackageMinus, title: "¿Qué gasta cada uno?", text: "Ej. 1 cápsula Pacamara." },
  { icon: Save, title: "Guarda", text: "Desde ahí cada venta descuenta esto." },
];

function amount(quantity: number, unit: RecipeUnit): string {
  return unit === "kg" ? formatKg(quantity) : String(Math.round(quantity * 1000) / 1000);
}

const EXAMPLE_SOLD = 3;

// Crear o editar una receta: arriba la guía de 3 pasos; a la izquierda se
// elige el producto vendido y lo que gasta cada uno, y a la derecha una
// vista previa en palabras de lo que se va a descontar ("Cada vez que se
// venda 1 Americano → −1 Cápsula Pacamara"), con un ejemplo de 3 ventas.
export function RecipeEditorDialog({ open, onOpenChange, posConfigId, storeName, recipe, catalog, catalogLoading, existing }: RecipeEditorDialogProps) {
  const save = useSaveRecipe();
  const reduce = useReducedMotion() ?? false;
  const [product, setProduct] = useState<RecipeCatalogItem | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [wasOpen, setWasOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  if (open && !wasOpen) {
    setWasOpen(true);
    setSaved(false);
    save.reset();
    setProduct(recipe ? (catalog.find((item) => item.productId === recipe.productId) ?? { productId: recipe.productId, productName: recipe.productName, categoryName: "", unit: "unidad" }) : null);
    setIngredients(recipe ? recipe.components.map((component) => ({ ...component })) : []);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  // Lo que no se puede elegir: productos que ya tienen receta (salvo el que
  // se edita) y los que ya son ingrediente de otra receta.
  const others = useMemo(() => existing.filter((item) => item.productId !== recipe?.productId), [existing, recipe]);
  const soldIds = useMemo(() => new Set(others.map((item) => item.productId)), [others]);
  const usedAsIngredient = useMemo(() => new Set(others.flatMap((item) => item.components.map((component) => component.productId))), [others]);
  const productExclude = useMemo(() => new Set([...soldIds, ...usedAsIngredient]), [soldIds, usedAsIngredient]);
  const ingredientExclude = useMemo(
    () => new Set([...soldIds, ...(product ? [product.productId] : []), ...ingredients.map((item) => item.productId)]),
    [soldIds, product, ingredients],
  );

  const validIngredients = ingredients.filter((item) => (item.quantity ?? 0) > 0);
  const stepIndex = product === null ? 0 : validIngredients.length === 0 ? 1 : 2;
  const blocked = product === null ? "Elige el producto que se vende." : validIngredients.length === 0 ? "Agrega al menos un ingrediente con su cantidad." : null;

  function addIngredient(item: RecipeCatalogItem) {
    setIngredients((current) => [...current, { productId: item.productId, productName: item.productName, unit: item.unit, quantity: 1 }]);
  }

  function handleSave() {
    if (!product || blocked) return;
    save.mutate(
      {
        posConfigId,
        productId: product.productId,
        payload: { components: validIngredients.map((item) => ({ productId: item.productId, quantity: item.quantity as number })) },
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => onOpenChange(false), 1100);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
      <DialogContent className="flex max-h-[94vh] w-[calc(100vw-1.5rem)] flex-col gap-4 overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <ChefHat className="size-6 text-primary" aria-hidden="true" />
            {recipe ? `Editar receta · ${recipe.productName}` : "Nueva receta"}
          </DialogTitle>
          <DialogDescription>Para {storeName}. Solo cambia cómo se descuenta el inventario de esta tienda.</DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
            <CheckCircle2 className="size-14 text-emerald-600" aria-hidden="true" />
            <p className="text-xl font-bold text-foreground">Receta guardada</p>
          </div>
        ) : (
          <>
            <HelpSteps steps={HELP} currentIndex={stepIndex} />

            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-w-0 flex-col gap-4">
                {/* 1. Producto vendido */}
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-foreground">1. ¿Qué producto se vende en el POS?</h3>
                  {product ? (
                    <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2.5">
                      <Coffee className="size-5 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">{product.productName}</span>
                      {!recipe && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => setProduct(null)}>
                          Cambiar
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ProductSearch
                      className="h-72"
                      items={catalog}
                      excludeIds={productExclude}
                      onSelect={setProduct}
                      isLoading={catalogLoading}
                      placeholder="Busca la bebida o el producto, ej. Americano"
                      autoFocus
                    />
                  )}
                </section>

                {/* 2. Ingredientes */}
                {product && (
                  <section className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-foreground">2. ¿Qué gasta cada {product.productName}?</h3>
                    {ingredients.length > 0 && (
                      <ul className="flex flex-col gap-2">
                        <AnimatePresence initial={false}>
                          {ingredients.map((item) => (
                            <motion.li
                              key={item.productId}
                              layout={!reduce}
                              initial={reduce ? false : { opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={reduce ? undefined : { opacity: 0, x: -12 }}
                              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                            >
                              <span className="min-w-0 flex-1 basis-40">
                                <span className="block truncate text-sm font-medium text-foreground">{item.productName}</span>
                                <span className="text-xs text-muted-foreground">{item.unit === "kg" ? "en kg" : "en piezas"} por cada uno vendido</span>
                              </span>
                              <QuantityStepper
                                value={item.quantity}
                                onChange={(next) =>
                                  setIngredients((current) => current.map((row) => (row.productId === item.productId ? { ...row, quantity: next } : row)))
                                }
                                step={item.unit === "kg" ? 0.05 : 1}
                                suffix={item.unit === "kg" ? "kg" : undefined}
                                size="lg"
                                ariaLabel={`Cantidad de ${item.productName}`}
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Quitar ${item.productName}`}
                                onClick={() => setIngredients((current) => current.filter((row) => row.productId !== item.productId))}
                              >
                                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                              </Button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                    <ProductSearch
                      className="h-56"
                      items={catalog}
                      excludeIds={ingredientExclude}
                      onSelect={addIngredient}
                      isLoading={catalogLoading}
                      placeholder={ingredients.length ? "Agregar otro ingrediente..." : "Busca el ingrediente, ej. Pacamara"}
                    />
                  </section>
                )}
              </div>

              {/* Vista previa en palabras */}
              <PreviewSheet className="self-start" title="Así se va a descontar" subtitle={storeName}>
                {!product || validIngredients.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Elige el producto y sus ingredientes para ver cómo se descuenta.</p>
                ) : (
                  <div className="flex flex-col gap-4 text-sm">
                    <div>
                      <p className="text-foreground">
                        Cada vez que se venda <span className="font-semibold">1 {product.productName}</span>:
                      </p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {validIngredients.map((item) => (
                          <li key={item.productId} className="flex items-center gap-2 font-semibold text-destructive">
                            <ArrowRight className="size-3.5" aria-hidden="true" />− {amount(item.quantity as number, item.unit)} {item.productName}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Ejemplo</p>
                      <p className="mt-1 text-foreground">
                        Si hoy venden <span className="font-semibold">{EXAMPLE_SOLD}</span>, se descuentan:
                      </p>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {validIngredients.map((item) => (
                          <li key={item.productId} className="font-semibold text-foreground tabular-nums">
                            − {amount((item.quantity as number) * EXAMPLE_SOLD, item.unit)} {item.productName}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.productName} deja de llevar existencia propia en esta tienda: no se cuenta en Conteo ni sale en el Kardex.
                    </p>
                  </div>
                )}
              </PreviewSheet>
            </div>

            {save.isError && (
              <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {save.error.message}
              </div>
            )}

            <DialogFooter className="items-center gap-2 sm:justify-between">
              <p className={blocked ? "text-sm text-amber-700 dark:text-amber-300" : "text-sm text-muted-foreground"}>{blocked ?? "Lista para guardar."}</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                  Cancelar
                </Button>
                <Button type="button" size="lg" onClick={handleSave} disabled={save.isPending || blocked !== null}>
                  {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                  Guardar receta
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
