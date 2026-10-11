"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "cn";
import { DataTable, type DataTableColumn } from "@/design-system/components/data-table";
import { Input } from "@/components/ui/input";
import { ValueBox } from "@/design-system/components/value-box";
import { InfoHint } from "@/features/inventory-guide/components/info-hint";
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
  /** Vendedor: solo ve la existencia estimada de su tienda — sin la columna
   * de captura ni el botón de guardar (el backend tampoco le deja escribir). */
  readOnly?: boolean;
}

// Tabla editable del catálogo completo de Odoo por tienda. Cada producto
// muestra DOS campos a la par: "Existencia estimada" — de solo lectura,
// el último conteo menos ventas y mermas/regalías/degustaciones, más
// entradas confirmadas — e "Inventario nuevo" — el input editable donde
// Finanzas captura el conteo físico real, que es lo único que se guarda.
// (La existencia de Odoo ya no se muestra: sus cantidades salen negativas
// porque Odoo nunca recibió las entradas ni los ajustes.) Se guarda en LOTE con un botón "Guardar cambios" que
// abre un panel de confirmación antes de mandar el PUT — no autosave por
// fila. La tabla es la estándar de Inventario (DataTable): filtros por
// columna, pie con total y filas por página. Los borradores viven en este
// componente, así que se conservan al cambiar de página o filtrar.
export function InventoryTable({ posConfigId, storeName, items, isLoading, isError, errorMessage, readOnly = false }: InventoryTableProps) {
  const upsert = useUpsertInventoryBulk();
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

  // Caja de solo lectura con la existencia estimada — mismo ancho/
  // alineación que el input editable de al lado, para que se lean como un
  // par. "—" si el producto nunca se ha contado (no hay de dónde partir).
  // Son funciones de render (no componentes) para que el input no se
  // remonte —y pierda el foco— en cada tecla.
  function renderEstimated(item: InventoryItem) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <ValueBox
          aria-label={`Existencia estimada de ${item.productName}`}
          value={item.estimatedQuantity != null ? String(Math.round(item.estimatedQuantity * 1000) / 1000) : null}
        />
        <span className="text-xs text-muted-foreground">{item.unit === "kg" ? "Kg" : "u"}</span>
      </div>
    );
  }

  function renderNewQuantity(item: InventoryItem) {
    const value = draftValue(item);
    const invalid = !isValidDraft(value);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-end gap-1.5">
          <Input
            type="number"
            min={0}
            step={item.unit === "kg" ? "0.001" : "1"}
            placeholder="Sin contar"
            value={value}
            onChange={(e) => setDraft(item.productId, e.target.value)}
            aria-invalid={invalid}
            aria-label={`Inventario nuevo de ${item.productName}`}
            className={cn("w-24 border-foreground/30 bg-background text-right tabular-nums", invalid && "border-destructive")}
          />
          <span className="text-xs text-muted-foreground">{item.unit === "kg" ? "Kg" : "u"}</span>
        </div>
        <LastModifiedNote email={item.updatedByEmail} date={item.updatedAt} />
      </div>
    );
  }

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      id: "index",
      header: "#",
      label: "#",
      cell: (_item, index) => <span className="text-muted-foreground">{index + 1}</span>,
      className: "w-10",
      nowrap: true,
      mobile: "hidden",
    },
    {
      id: "product",
      header: "Producto",
      label: "Producto",
      cell: (item) => item.productName,
      accessor: (item) => item.productName,
      filter: "text",
      mobile: "title",
    },
    {
      id: "unit",
      header: "Unidad",
      label: "Unidad",
      cell: (item) => <span className="text-muted-foreground">{item.unit === "kg" ? "Kg" : "Unidad"}</span>,
      accessor: (item) => (item.unit === "kg" ? "Kg" : "Unidad"),
      filter: "select",
    },
    {
      id: "estimated",
      header: (
        <>
          <span className="inline-flex items-center justify-end gap-1">
            Existencia estimada
            <InfoHint topic="existencia-estimada" />
          </span>
          <span className="block text-[10px] font-normal text-muted-foreground">conteo − ventas ± movimientos</span>
        </>
      ),
      label: "Existencia estimada",
      cell: (item) => renderEstimated(item),
      accessor: (item) => (item.estimatedQuantity != null ? "Contado" : "Sin contar"),
      filter: "select",
      align: "right",
      tourId: "inv-estimated",
    },
    ...(readOnly
      ? []
      : [
          {
            id: "count",
            header: (
              <>
                Inventario nuevo
                <span className="block text-[10px] font-normal text-muted-foreground">se guarda esto</span>
              </>
            ),
            label: "Inventario nuevo",
            cell: (item: InventoryItem) => renderNewQuantity(item),
            align: "right" as const,
            tourId: "inv-count",
          },
        ]),
  ];

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {dirtyEntries.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {dirtyEntries.length} sin guardar
            </span>
          )}
          <Button type="button" onClick={handleOpenConfirm} disabled={!canOpenConfirm} data-tour="inv-save">
            Guardar cambios
          </Button>
        </div>
      )}

      {isError ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <ChartErrorState message={errorMessage} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(item) => item.productId}
          isLoading={isLoading}
          emptyMessage="Sin productos en el catálogo."
          itemLabel={{ singular: "producto", plural: "productos" }}
          filtersTourId="inv-search"
        />
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
