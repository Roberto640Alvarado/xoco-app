"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Loader2, PackagePlus, ShoppingBasket, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuantityStepper } from "@/design-system/components/quantity-stepper";
import { useCreateStockRequest } from "../hooks/use-stock-request-actions";
import { useStockRequestCatalog } from "../hooks/use-stock-requests";
import { groupByCategory } from "../lib/group-by-category";
import { CategoryProductPicker } from "./category-product-picker";
import type { StockRequestCatalogItem } from "../types/stock-request.types";

interface NewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName?: string;
  onCreated?: (id: string) => void;
}

const STEPS = ["Elige los productos", "Revisa tu pedido", "Envía a planta"];

// "Nueva solicitud": pantalla grande en dos columnas. A la izquierda se
// elige por categoría; a la derecha crece "Tu pedido" con lo elegido, la nota
// y el botón de enviar (que explica por qué está deshabilitado). En móvil
// son dos vistas: elegir y revisar.
export function NewRequestDialog({ open, onOpenChange, storeName, onCreated }: NewRequestDialogProps) {
  const create = useCreateStockRequest();
  const { data: catalog, isLoading } = useStockRequestCatalog(open);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [view, setView] = useState<"elegir" | "revisar">("elegir");
  const [wasOpen, setWasOpen] = useState(false);

  // Ajuste de estado durante el render (patrón del proyecto): al abrir, formulario limpio.
  if (open && !wasOpen) {
    setWasOpen(true);
    setQuantities({});
    setNote("");
    setView("elegir");
    create.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const chosenItems = useMemo(
    () => (catalog ?? []).filter((item) => (quantities[item.productId] ?? 0) > 0),
    [catalog, quantities],
  );
  const groups = useMemo(() => groupByCategory(chosenItems), [chosenItems]);
  const count = chosenItems.length;
  // Paso actual de la guía: 0 elegir, 1 revisar (hay productos), 2 listo para enviar.
  const stepIndex = count === 0 ? 0 : view === "revisar" ? 2 : 1;

  function handleQuantity(item: StockRequestCatalogItem, quantity: number | null) {
    setQuantities((current) => {
      const next = { ...current };
      if (!quantity || quantity <= 0) delete next[item.productId];
      else next[item.productId] = quantity;
      return next;
    });
  }

  function handleSubmit() {
    if (count === 0) return;
    create.mutate(
      {
        note: note.trim() || undefined,
        lines: chosenItems.map((item) => ({ productId: item.productId, quantity: quantities[item.productId] })),
      },
      {
        onSuccess: (request) => {
          onOpenChange(false);
          onCreated?.(request.id);
        },
      },
    );
  }

  const disabledReason = count === 0 ? "Agrega al menos un producto para poder enviar." : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="flex h-[92vh] w-[calc(100vw-1.5rem)] flex-col gap-3 overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <PackagePlus className="size-5 text-primary" aria-hidden="true" />
            Nueva solicitud de stock
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {storeName ? `Para ${storeName}. ` : ""}Planta te responde qué sí tiene y te avisa cuando despache.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-wrap gap-2" aria-label="Pasos">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === stepIndex ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                index < stepIndex && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                index === stepIndex && "border-primary bg-primary/10 text-foreground",
                index > stepIndex && "border-border text-muted-foreground",
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-background text-[10px] font-bold">{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className={cn("flex min-h-0 flex-col", view === "revisar" && "hidden lg:flex")} aria-label="Productos">
            <CategoryProductPicker
              className="flex-1"
              items={catalog ?? []}
              quantities={quantities}
              onQuantityChange={handleQuantity}
              isLoading={isLoading}
            />
          </section>

          <aside
            className={cn("flex min-h-0 flex-col rounded-xl border border-border bg-muted/30", view === "elegir" && "hidden lg:flex")}
            aria-label="Tu pedido"
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <ShoppingBasket className="size-4 text-primary" aria-hidden="true" />
              <h3 className="flex-1 text-sm font-semibold text-foreground">Tu pedido</h3>
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {count} producto{count === 1 ? "" : "s"}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {count === 0 ? (
                <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <ClipboardList className="size-7" aria-hidden="true" />
                  Aquí verás lo que vas eligiendo.
                  <span className="text-xs">Pulsa “Agregar” en un producto para empezar.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {groups.map((group) => (
                    <div key={group.category}>
                      <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{group.category}</p>
                      <ul className="flex flex-col gap-1.5">
                        {group.items.map((item) => (
                          <li key={item.productId} className="flex items-center gap-2 rounded-lg bg-background px-2 py-1.5">
                            <span className="min-w-0 flex-1 text-sm text-foreground">{item.productName}</span>
                            <QuantityStepper
                              value={quantities[item.productId]}
                              onChange={(next) => handleQuantity(item, next)}
                              step={item.unit === "kg" ? 0.5 : 1}
                              ariaLabel={`Cantidad de ${item.productName}`}
                            />
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`Quitar ${item.productName}`}
                              onClick={() => handleQuantity(item, null)}
                            >
                              <Trash2 className="text-destructive" aria-hidden="true" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border px-3 py-2.5">
              <Label htmlFor="request-note" className="text-xs">
                Nota para planta (opcional)
              </Label>
              <Textarea
                id="request-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Ej. urgente para el fin de semana"
              />
            </div>
          </aside>
        </div>

        {create.isError && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {create.error.message}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className={cn("text-sm", disabledReason ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>
            {disabledReason ?? `Listo: ${count} producto${count === 1 ? "" : "s"} para ${storeName ?? "tu tienda"}.`}
          </p>
          <div className="flex gap-2">
            {view === "revisar" && (
              <Button type="button" variant="outline" className="lg:hidden" onClick={() => setView("elegir")}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Seguir eligiendo
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              Cancelar
            </Button>
            {view === "elegir" && (
              <Button type="button" variant="secondary" className="lg:hidden" disabled={count === 0} onClick={() => setView("revisar")}>
                Revisar pedido ({count})
              </Button>
            )}
            <Button
              type="button"
              className={cn(view === "elegir" && "max-lg:hidden")}
              onClick={handleSubmit}
              disabled={create.isPending || count === 0}
            >
              {create.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Enviando...
                </>
              ) : (
                "Enviar solicitud"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
