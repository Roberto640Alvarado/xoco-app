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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LastModifiedNote } from "@/components/ui/last-modified-note";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { formatInteger, formatKg } from "@/lib/format";
import { useUpsertInventoryBulk } from "../hooks/use-upsert-inventory-bulk";
import type { InventoryItem, InventoryUnit } from "../types/inventory.types";

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

function formatQuantity(quantity: number, unit: InventoryUnit): string {
  return unit === "kg" ? formatKg(quantity) : `${formatInteger(quantity)} u`;
}

interface DirtyEntry {
  productId: number;
  productName: string;
  unit: InventoryUnit;
  quantity: number;
}

interface ConfirmSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName?: string;
  entries: DirtyEntry[];
  upsert: ReturnType<typeof useUpsertInventoryBulk>;
  onConfirm: () => void;
}

// Panel de confirmación antes de guardar — pedido explícito del usuario
// ("las cosas de guardar siempre con un panel de confirmación"). Mismo
// patrón visual que CreateUserModal/GrowthPercentModal: éxito visible
// antes de cerrarse solo, error inline si falla, sin cerrar para poder
// reintentar.
function ConfirmSaveDialog({ open, onOpenChange, storeName, entries, upsert, onConfirm }: ConfirmSaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !upsert.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Confirmar guardado</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            Vas a guardar {entries.length} {entries.length === 1 ? "cambio" : "cambios"} de inventario
            {storeName ? (
              <>
                {" "}
                en <span className="font-medium text-foreground">{storeName}</span>
              </>
            ) : null}
            .
          </DialogDescription>
        </DialogHeader>

        {upsert.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            Inventario guardado correctamente.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li key={entry.productId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="text-foreground">{entry.productName}</span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">
                    {formatQuantity(entry.quantity, entry.unit)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {upsert.isError && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {upsert.error.message}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={upsert.isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={upsert.isPending || upsert.isSuccess}>
            {upsert.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : upsert.isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Guardado
              </>
            ) : (
              "Confirmar guardado"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface InventoryTableProps {
  posConfigId: number;
  storeName?: string;
  items: InventoryItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

// Tabla editable del catálogo completo de Odoo por tienda — a diferencia
// del resto de tablas del dashboard (que son de solo lectura), acá cada
// fila es un input de captura. Se guarda en LOTE con un botón "Guardar
// cambios" que abre un panel de confirmación antes de mandar el PUT
// (pedido explícito del usuario) — no autosave por fila, para no
// disparar una petición por cada tecla. Buscador porque el catálogo
// completo puede ser largo (a diferencia del top 10 de Categorías).
export function InventoryTable({ posConfigId, storeName, items, isLoading, isError, errorMessage }: InventoryTableProps) {
  const upsert = useUpsertInventoryBulk();
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Si se cambia de tienda, los drafts de la tienda anterior ya no
  // aplican — mismo criterio de "ajustar estado durante el render" que
  // CreateUserModal/GrowthPercentModal en vez de un useEffect.
  const [lastPosConfigId, setLastPosConfigId] = useState(posConfigId);
  if (posConfigId !== lastPosConfigId) {
    setLastPosConfigId(posConfigId);
    setDrafts({});
    setConfirmOpen(false);
    upsert.reset();
  }

  // Cada vez que llega un lote nuevo de `items` (primer "Traer
  // inventario", o un refetch), se precarga como draft la existencia de
  // Odoo (odooQuantity) de los productos que TODAVÍA no se han contado
  // (quantity === null) — así Finanzas parte de esa referencia en vez de
  // un campo vacío, y solo la ajusta. No se pisa un draft que el usuario
  // ya haya tocado (comparación por referencia de `items`, no un
  // useEffect, mismo criterio del resto del archivo).
  const [seededItems, setSeededItems] = useState<InventoryItem[] | null>(null);
  if (items.length > 0 && seededItems !== items) {
    setSeededItems(items);
    setDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const item of items) {
        if (item.quantity == null && item.odooQuantity != null && next[item.productId] === undefined) {
          next[item.productId] = quantityToInput(item.odooQuantity);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  const query = search.trim().toLowerCase();
  const filteredItems = query ? items.filter((item) => item.productName.toLowerCase().includes(query)) : items;

  function draftValue(item: InventoryItem): string {
    return drafts[item.productId] ?? quantityToInput(item.quantity);
  }

  function setDraft(productId: number, value: string) {
    setDrafts((prev) => ({ ...prev, [productId]: value }));
  }

  const dirtyEntries: DirtyEntry[] = Object.entries(drafts)
    .map(([productIdRaw, value]) => {
      const productId = Number(productIdRaw);
      const item = items.find((i) => i.productId === productId);
      if (!item || value.trim() === "" || !isValidDraft(value)) return null;
      const quantity = Number(value);
      if (quantity === item.quantity) return null; // sin cambio real
      return { productId, productName: item.productName, unit: item.unit, quantity };
    })
    .filter((entry): entry is DirtyEntry => entry !== null);

  const hasInvalidDraft = Object.values(drafts).some((value) => !isValidDraft(value));
  const canOpenConfirm = dirtyEntries.length > 0 && !hasInvalidDraft;

  function handleOpenConfirm() {
    if (!canOpenConfirm) return;
    upsert.reset();
    setConfirmOpen(true);
  }

  function handleConfirm() {
    upsert.mutate(
      { posConfigId, entries: dirtyEntries.map(({ productId, quantity }) => ({ productId, quantity })) },
      {
        onSuccess: () => {
          setDrafts({});
          setTimeout(() => setConfirmOpen(false), 1200);
        },
      },
    );
  }

  function QuantityInput({ item }: { item: InventoryItem }) {
    const value = draftValue(item);
    const invalid = !isValidDraft(value);
    // Todavía no se ha guardado ninguna captura para este producto en
    // esta tienda, y el valor que se ve viene precargado de la
    // existencia de Odoo (ver seedeo de drafts arriba) — se lo hace notar
    // para que Finanzas lo verifique en vez de asumir que ya es un
    // conteo confirmado.
    const isOdooSuggestion = item.quantity == null && item.odooQuantity != null;
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
        {isOdooSuggestion ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">Sugerido por Odoo — verifica</p>
        ) : (
          <LastModifiedNote email={item.updatedByEmail} date={item.updatedAt} />
        )}
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
          {dirtyEntries.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {dirtyEntries.length} sin guardar
            </span>
          )}
          <Button type="button" onClick={handleOpenConfirm} disabled={!canOpenConfirm}>
            Guardar cambios
          </Button>
        </div>
      </div>

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

      <ConfirmSaveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        storeName={storeName}
        entries={dirtyEntries}
        upsert={upsert}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
