"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChefHat, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreSelect } from "@/components/filters/store-select";
import { formatDateTime, formatKg } from "@/lib/format";
import { SectionCard } from "@/design-system/components/section-card";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useCopyRecipes, useDeleteRecipe, useRecipeCatalog, useRecipes } from "../hooks/use-recipes";
import { RecipeEditorDialog } from "./recipe-editor-dialog";
import type { Recipe, RecipeComponent } from "../types/recipes.types";

function componentText(component: RecipeComponent): string {
  const amount = component.unit === "kg" ? formatKg(component.quantity) : String(component.quantity);
  return `${amount} ${component.productName}`;
}

// Inventario → Recetas (solo Super admin): por tienda, qué gasta cada producto que se
// vende (ej. Americano → 1 cápsula Pacamara). Cada venta en esa tienda
// descuenta los ingredientes en vez del producto, en Conteo, Registro y
// Kardex. Se pueden copiar las recetas de otra tienda y ajustarlas.
export function RecipesView() {
  const reduce = useReducedMotion() ?? false;
  const { data: stores, isLoading: storesLoading } = useStores();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(undefined);
  const [editor, setEditor] = useState<{ recipe: Recipe | null } | null>(null);
  const [toDelete, setToDelete] = useState<Recipe | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySource, setCopySource] = useState<number | undefined>(undefined);

  if (posConfigId === undefined && stores && stores.length > 0) setPosConfigId(stores[0].id);

  const catalog = useRecipeCatalog();
  const recipes = useRecipes(posConfigId);
  const remove = useDeleteRecipe();
  const copy = useCopyRecipes();
  const list = useMemo(() => recipes.data ?? [], [recipes.data]);
  const storeName = stores?.find((store) => store.id === posConfigId)?.name ?? "la tienda";
  const otherStores = (stores ?? []).filter((store) => store.id !== posConfigId);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SectionCard
        icon={ChefHat}
        title="Recetas"
        description="Qué descuenta cada producto vendido, por tienda."
        tourId="recipes-header"
        singleLineControls
      >
        <StoreSelect stores={stores} isLoading={storesLoading} value={posConfigId} onChange={setPosConfigId} hideAllStoresOption />
        <Button type="button" variant="outline" onClick={() => setCopyOpen(true)} disabled={posConfigId === undefined || otherStores.length === 0}>
          <Copy className="size-4" aria-hidden="true" />
          Copiar de otra tienda
        </Button>
        <Button type="button" onClick={() => setEditor({ recipe: null })} disabled={posConfigId === undefined}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva receta
        </Button>
      </SectionCard>

      {recipes.isError ? (
        <ChartErrorState message={recipes.error?.message} />
      ) : recipes.isLoading || posConfigId === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <ChefHat className="size-10 text-primary" aria-hidden="true" />
          <div className="flex max-w-lg flex-col gap-1">
            <p className="text-lg font-semibold text-foreground">{storeName} todavía no tiene recetas</p>
            <p className="text-sm text-muted-foreground">
              Úsalas para productos que se venden pero no se guardan en bodega, como las bebidas. Así, cuando se venda un americano, se descuenta la
              cápsula Pacamara en vez del americano.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm">
            <span className="rounded-lg bg-card px-2.5 py-1 font-medium shadow-xs">Se vende 1 Americano</span>
            <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="rounded-lg bg-card px-2.5 py-1 font-semibold text-destructive shadow-xs">− 1 Cápsula Pacamara</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" size="lg" onClick={() => setEditor({ recipe: null })}>
              <Plus className="size-4" aria-hidden="true" />
              Crear la primera receta
            </Button>
            {otherStores.length > 0 && (
              <Button type="button" size="lg" variant="outline" onClick={() => setCopyOpen(true)}>
                <Copy className="size-4" aria-hidden="true" />
                Copiar de otra tienda
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {list.length} receta{list.length === 1 ? "" : "s"} en {storeName}. Cada venta de estos productos descuenta sus ingredientes.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-tour="recipes-list">
            {list.map((recipe, index) => (
              <motion.article
                key={recipe.productId}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ChefHat className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground" title={recipe.productName}>
                      {recipe.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">Cada uno vendido descuenta:</p>
                  </div>
                </div>
                <ul className="flex flex-col gap-1">
                  {recipe.components.map((component) => (
                    <li key={component.productId} className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm">
                      <span className="font-semibold text-destructive tabular-nums">−</span>
                      <span className="min-w-0 truncate text-foreground">{componentText(component)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(recipe.updatedAt)} · {recipe.updatedByEmail}
                  </span>
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditor({ recipe })} aria-label={`Editar receta de ${recipe.productName}`}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Editar
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setToDelete(recipe)} aria-label={`Quitar receta de ${recipe.productName}`}>
                      <Trash2 className="size-3.5 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </>
      )}

      {posConfigId !== undefined && (
        <RecipeEditorDialog
          open={editor !== null}
          onOpenChange={(next) => !next && setEditor(null)}
          posConfigId={posConfigId}
          storeName={storeName}
          recipe={editor?.recipe ?? null}
          catalog={catalog.data ?? []}
          catalogLoading={catalog.isLoading}
          existing={list}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(next) => !next && setToDelete(null)}
        title={toDelete ? `¿Quitar la receta de ${toDelete.productName}?` : ""}
        description={`Las ventas de ${toDelete?.productName ?? "este producto"} en ${storeName} volverán a descontar el producto mismo, no sus ingredientes.`}
        confirmLabel="Quitar receta"
        variant="destructive"
        isLoading={remove.isPending}
        errorMessage={remove.error?.message}
        onConfirm={() =>
          toDelete &&
          posConfigId !== undefined &&
          remove.mutate({ posConfigId, productId: toDelete.productId }, { onSuccess: () => setToDelete(null) })
        }
      />

      <ConfirmDialog
        open={copyOpen}
        onOpenChange={(next) => {
          if (!next) {
            setCopyOpen(false);
            setCopySource(undefined);
            copy.reset();
          }
        }}
        title={`Copiar recetas a ${storeName}`}
        description="Se copian todas las recetas de la tienda que elijas. Si ya hay receta para el mismo producto, se reemplaza; las demás se quedan."
        confirmLabel="Copiar recetas"
        isLoading={copy.isPending}
        errorMessage={copy.error?.message}
        onConfirm={() =>
          copySource !== undefined &&
          posConfigId !== undefined &&
          copy.mutate(
            { posConfigId, sourcePosConfigId: copySource },
            {
              onSuccess: () => {
                setCopyOpen(false);
                setCopySource(undefined);
              },
            },
          )
        }
      >
        <Select value={copySource === undefined ? "" : String(copySource)} onValueChange={(next) => setCopySource(next ? Number(next) : undefined)}>
          <SelectTrigger aria-label="Tienda de origen" className="w-full">
            <SelectValue>{(raw: string) => otherStores.find((store) => String(store.id) === raw)?.name ?? "Elige la tienda de origen"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {otherStores.map((store) => (
              <SelectItem key={store.id} value={String(store.id)}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ConfirmDialog>
    </div>
  );
}
