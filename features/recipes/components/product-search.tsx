"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import type { RecipeCatalogItem } from "../types/recipes.types";

interface ProductSearchProps {
  items: RecipeCatalogItem[];
  excludeIds?: Set<number>;
  onSelect: (item: RecipeCatalogItem) => void;
  placeholder: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const MAX_RESULTS = 60;

// Buscador de productos del catálogo: se escribe parte del nombre y se toca
// el producto. Muestra la categoría para distinguir productos parecidos.
export function ProductSearch({ items, excludeIds, onSelect, placeholder, isLoading = false, autoFocus = false, className }: ProductSearchProps) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();

  const results = useMemo(() => {
    const available = items.filter((item) => !excludeIds?.has(item.productId));
    const matches = term ? available.filter((item) => `${item.productName} ${item.categoryName}`.toLowerCase().includes(term)) : available;
    return matches.slice(0, MAX_RESULTS);
  }, [items, excludeIds, term]);

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 pl-9 text-base"
          autoFocus={autoFocus}
        />
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto rounded-xl border border-border" aria-label="Resultados">
        {isLoading ? (
          <li className="p-4 text-center text-sm text-muted-foreground">Cargando productos...</li>
        ) : results.length === 0 ? (
          <li className="p-4 text-center text-sm text-muted-foreground">{term ? `Ningún producto coincide con “${search}”.` : "No hay productos para elegir."}</li>
        ) : (
          results.map((item) => (
            <li key={item.productId}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{item.productName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.categoryName} · {item.unit === "kg" ? "por kg" : "por pieza"}
                  </span>
                </span>
                <Plus className="size-4 shrink-0 text-primary" aria-hidden="true" />
              </button>
            </li>
          ))
        )}
      </ul>
      {!isLoading && !term && results.length === MAX_RESULTS && (
        <p className="text-xs text-muted-foreground">Escribe para buscar entre todos los productos.</p>
      )}
    </div>
  );
}
