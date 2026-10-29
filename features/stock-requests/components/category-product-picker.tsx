"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuantityStepper } from "@/design-system/components/quantity-stepper";
import { groupByCategory } from "../lib/group-by-category";
import type { StockRequestCatalogItem } from "../types/stock-request.types";

interface CategoryProductPickerProps {
  items: StockRequestCatalogItem[];
  /** Cantidad elegida por producto (ausente = no elegido). */
  quantities: Record<number, number>;
  onQuantityChange: (item: StockRequestCatalogItem, quantity: number | null) => void;
  /** Productos que no se ofrecen (ej. los que ya están en la solicitud). */
  excludeIds?: Set<number>;
  isLoading?: boolean;
  /** Texto del botón de cada producto sin elegir. */
  addLabel?: string;
  /** Categoría que se muestra primero (ej. la del producto que se reemplaza). */
  defaultCategory?: string;
  className?: string;
}

// Catálogo por categoría, como el formato de envío a sucursales: a la
// izquierda las categorías (con cuántos productos elegiste en cada una) y a
// la derecha los productos de la categoría activa. Cada producto tiene un
// botón "Agregar"; al agregarlo se vuelve un contador. Al buscar se ve
// todo lo que coincide, sin importar la categoría.
export function CategoryProductPicker({
  items,
  quantities,
  onQuantityChange,
  excludeIds,
  isLoading = false,
  addLabel = "Agregar",
  defaultCategory,
  className,
}: CategoryProductPickerProps) {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string | null>(defaultCategory ?? null);

  const groups = useMemo(() => groupByCategory(items.filter((item) => !excludeIds?.has(item.productId))), [items, excludeIds]);
  const term = search.trim().toLowerCase();
  const searching = term.length > 0;
  const current = groups.find((group) => group.category === active) ?? groups[0];

  const visible = useMemo(() => {
    if (searching) {
      return groups
        .map((group) => ({ ...group, items: group.items.filter((item) => item.productName.toLowerCase().includes(term)) }))
        .filter((group) => group.items.length > 0);
    }
    return current ? [current] : [];
  }, [groups, current, searching, term]);

  const chosenIn = (category: string) =>
    groups.find((group) => group.category === category)?.items.filter((item) => (quantities[item.productId] ?? 0) > 0).length ?? 0;

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Escribe el nombre del producto para buscarlo..."
          aria-label="Buscar producto"
          className="h-12 pl-9 text-base"
        />
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando productos...</p>
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No hay más productos para agregar.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
          <nav
            aria-label="Categorías"
            className={cn(
              "flex shrink-0 gap-1.5 overflow-x-auto pb-1 md:w-52 md:flex-col md:overflow-x-visible md:overflow-y-auto md:pr-1 md:pb-0",
              searching && "pointer-events-none opacity-40",
            )}
          >
            {groups.map((group) => {
              const isActive = !searching && group.category === current?.category;
              const chosen = chosenIn(group.category);
              return (
                <button
                  key={group.category}
                  type="button"
                  onClick={() => setActive(group.category)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    isActive ? "border-primary bg-primary/10 font-semibold text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="whitespace-nowrap md:whitespace-normal">{group.category}</span>
                  {chosen > 0 ? (
                    <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{chosen}</span>
                  ) : (
                    <span className="text-[11px] tabular-nums text-muted-foreground">{group.items.length}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border">
            {visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Ningún producto coincide con “{search}”.</p>
            ) : (
              visible.map((group) => (
                <section key={group.category}>
                  <h3 className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {group.category}
                  </h3>
                  <ul className="divide-y divide-border">
                    {group.items.map((item) => {
                      const quantity = quantities[item.productId] ?? 0;
                      const chosen = quantity > 0;
                      return (
                        <li key={item.productId} className={cn("flex flex-wrap items-center gap-3 px-3 py-3 transition-colors", chosen && "bg-emerald-500/5")}>
                          <span className="min-w-0 flex-1 basis-40">
                            <span className="block text-base font-medium text-foreground">{item.productName}</span>
                            <span className="block text-xs text-muted-foreground">{item.unit === "kg" ? "Se pide por kg" : "Se pide por pieza"}</span>
                          </span>
                          {chosen ? (
                            <span className="flex items-center gap-2">
                              <Check className="size-5 text-emerald-600" aria-label="Agregado" />
                              <QuantityStepper
                                value={quantity}
                                onChange={(next) => onQuantityChange(item, next)}
                                step={item.unit === "kg" ? 0.5 : 1}
                                ariaLabel={`Cantidad de ${item.productName}`}
                                size="lg"
                              />
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="lg"
                              variant="outline"
                              className="min-w-32"
                              onClick={() => onQuantityChange(item, item.unit === "kg" ? 0.5 : 1)}
                              aria-label={`${addLabel} ${item.productName}`}
                            >
                              <Plus className="size-4" aria-hidden="true" />
                              {addLabel}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
