"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { cn } from "cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LastModifiedNote } from "@/components/ui/last-modified-note";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { useUpsertInventoryBulk } from "../hooks/use-upsert-inventory-bulk";
import type { InventoryItem } from "../types/inventory.types";

// "12" (unidad) -> "12"; "0.5" (kg) -> "0.5". null (todavía no contado)
// -> "" (input vacío, no "0" — un campo vacío se lee como "falta contar",
// un 0 como "se contó y no hay").
function quantityToInput(quantity: number | null): string {
  return quantity == null ? "" : String(quantity);
}

function isValidDraft(value: string): boolean {
  if (value.trim() === "") return true; // vacío = "no tocar este producto", válido
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0;
}

interface InventoryTableProps {
  posConfigId: number;
  items: InventoryItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

// Tabla editable del catálogo completo de Odoo por tienda — a diferencia
// del resto de tablas del dashboard (que son de solo lectura), acá cada
// fila es un input de captura. Se guarda en LOTE con un botón "Guardar
// cambios" (no autosave por fila) para no disparar una petición por cada
// tecla — mismo motivo que UpsertGoalsBulk. Buscador porque el catálogo
// completo puede ser largo (a diferencia del top 10 de Categorías).
export function InventoryTable({ posConfigId, items, isLoading, isError, errorMessage }: InventoryTableProps) {
  const upsert = useUpsertInventoryBulk();
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  // Si se cambia de tienda, los drafts de la tienda anterior ya no
  // aplican — mismo criterio de "ajustar estado durante el render" que
  // CreateUserModal/GrowthPercentModal en vez de un useEffect.
  const [lastPosConfigId, setLastPosConfigId] = useState(posConfigId);
  if (posConfigId !== lastPosConfigId) {
    setLastPosConfigId(posConfigId);
    setDrafts({});
    upsert.reset();
  }

  const query = search.trim().toLowerCase();
  const filteredItems = query ? items.filter((item) => item.productName.toLowerCase().includes(query)) : items;

  function draftValue(item: InventoryItem): string {
    return drafts[item.productId] ?? quantityToInput(item.quantity);
  }

  function setDraft(productId: number, value: string) {
    setDrafts((prev) => ({ ...prev, [productId]: value }));
    if (upsert.isSuccess) upsert.reset();
  }

  const dirtyEntries = Object.entries(drafts)
    .map(([productIdRaw, value]) => {
      const productId = Number(productIdRaw);
      const item = items.find((i) => i.productId === productId);
      if (!item || value.trim() === "" || !isValidDraft(value)) return null;
      const quantity = Number(value);
      if (quantity === item.quantity) return null; // sin cambio real
      return { productId, quantity };
    })
    .filter((entry): entry is { productId: number; quantity: number } => entry !== null);

  const hasInvalidDraft = Object.values(drafts).some((value) => !isValidDraft(value));
  const canSave = dirtyEntries.length > 0 && !hasInvalidDraft && !upsert.isPending;

  function handleSave() {
    if (dirtyEntries.length === 0) return;
    upsert.mutate({ posConfigId, entries: dirtyEntries }, { onSuccess: () => setDrafts({}) });
  }

  function QuantityInput({ item }: { item: InventoryItem }) {
    const value = draftValue(item);
    const invalid = !isValidDraft(value);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            step={item.unit === "kg" ? "0.001" : "1"}
            placeholder="Sin contar"
            value={value}
            onChange={(e) => setDraft(item.productId, e.target.value)}
            aria-invalid={invalid}
            className={cn("w-28 text-right tabular-nums", invalid && "border-destructive")}
          />
          <span className="text-xs text-muted-foreground">{item.unit === "kg" ? "Kg" : "u"}</span>
        </div>
        <LastModifiedNote email={item.updatedByEmail} date={item.updatedAt} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          {dirtyEntries.length > 0 && !upsert.isPending && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {dirtyEntries.length} sin guardar
            </span>
          )}
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {upsert.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : upsert.isSuccess && dirtyEntries.length === 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Guardado
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </div>

      {upsert.isError && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {upsert.error.message}
        </div>
      )}

      {isError ? (
        <ChartErrorState message={errorMessage} />
      ) : isLoading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {items.length === 0 ? "Sin productos en el catálogo." : "Ningún producto coincide con la búsqueda."}
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-border">
          {/* Desktop / tablet: tabla completa */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={item.productId}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="whitespace-normal">{item.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.unit === "kg" ? "Kg" : "Unidad"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <QuantityInput item={item} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: lista de tarjetas — mismo criterio que UsersTable */}
          <ul className="divide-y divide-border md:hidden">
            {filteredItems.map((item) => (
              <li key={item.productId} className="flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{item.productName}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.unit === "kg" ? "Kg" : "Unidad"}</span>
                </div>
                <QuantityInput item={item} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
