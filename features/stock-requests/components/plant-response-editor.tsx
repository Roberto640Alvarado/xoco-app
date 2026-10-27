"use client";

import { useMemo, useState } from "react";
import { CheckCheck, CheckCircle2, Circle, Loader2, PackagePlus, Save, Trash2, Truck } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressSteps } from "@/design-system/components/progress-steps";
import { QuantityStepper } from "@/design-system/components/quantity-stepper";
import { useDispatchStockRequest, useSavePlantResponse } from "../hooks/use-stock-request-actions";
import { useStockRequestCatalog } from "../hooks/use-stock-requests";
import { formatLineQuantity, groupByCategory } from "../lib/group-by-category";
import { CategoryProductPicker } from "./category-product-picker";
import type { SavePlantResponsePayload, StockRequest, StockRequestCatalogItem } from "../types/stock-request.types";

interface EditorLine {
  productId: number;
  productName: string;
  categoryName: string;
  unit: "unidad" | "kg";
  requested: number;
  /** null = sin responder, 0 = no hay. */
  sent: number | null;
  note: string;
  added: boolean;
}

function toEditorLines(request: StockRequest): EditorLine[] {
  return request.lines.map((line) => ({
    productId: line.productId,
    productName: line.productName,
    categoryName: line.categoryName,
    unit: line.unit,
    requested: line.requestedQuantity,
    sent: line.sentQuantity,
    note: line.plantNote ?? "",
    added: line.addedByPlant,
  }));
}

function toPayload(lines: EditorLine[], note: string): SavePlantResponsePayload {
  return {
    note: note.trim() || undefined,
    lines: lines.map((line) => ({
      productId: line.productId,
      sentQuantity: line.sent,
      note: line.note.trim() || null,
      added: line.added || undefined,
    })),
  };
}

interface PlantResponseEditorProps {
  request: StockRequest;
  /** Cierra el detalle después de despachar. */
  onDone: () => void;
}

type LineState = "pending" | "full" | "partial" | "none" | "added";

function lineState(line: EditorLine): LineState {
  if (line.sent === null) return "pending";
  if (line.added) return "added";
  if (line.sent === 0) return "none";
  if (line.sent < line.requested) return "partial";
  return "full";
}

const STATE_STYLE: Record<LineState, { bar: string; label: (line: EditorLine) => string; text: string }> = {
  pending: { bar: "border-l-amber-400", text: "text-amber-700 dark:text-amber-300", label: () => "Sin responder" },
  full: { bar: "border-l-emerald-500", text: "text-emerald-700 dark:text-emerald-300", label: (l) => `Envías todo (${formatLineQuantity(l.sent ?? 0, l.unit)})` },
  partial: {
    bar: "border-l-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    label: (l) => `Envías ${formatLineQuantity(l.sent ?? 0, l.unit)} de ${formatLineQuantity(l.requested, l.unit)}`,
  },
  none: { bar: "border-l-destructive", text: "text-destructive", label: () => "No hay" },
  added: { bar: "border-l-violet-500", text: "text-violet-700 dark:text-violet-300", label: (l) => `Agregado: envías ${formatLineQuantity(l.sent ?? 0, l.unit)}` },
};

// Planta responde la solicitud en tres pasos guiados:
// 1) por cada producto, cuánto envía ("Todo", una cantidad o "No hay");
// 2) revisa el resumen del envío; 3) despacha. La tienda recibe el aviso de
// que viene en camino. Los botones deshabilitados dicen por qué.
export function PlantResponseEditor({ request, onDone }: PlantResponseEditorProps) {
  const save = useSavePlantResponse();
  const dispatch = useDispatchStockRequest();
  const { data: catalog, isLoading: catalogLoading } = useStockRequestCatalog(true);

  const [lines, setLines] = useState<EditorLine[]>(() => toEditorLines(request));
  const [note, setNote] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const groups = useMemo(() => groupByCategory(lines), [lines]);
  const answered = lines.filter((line) => line.sent !== null).length;
  const unanswered = lines.length - answered;
  const totalSent = lines.reduce((sum, line) => sum + (line.sent ?? 0), 0);
  const counts = useMemo(() => {
    const result: Record<LineState, number> = { pending: 0, full: 0, partial: 0, none: 0, added: 0 };
    for (const line of lines) result[lineState(line)] += 1;
    return result;
  }, [lines]);
  const isPartial = counts.partial + counts.none > 0;
  const blockedReason =
    unanswered > 0
      ? `Faltan ${unanswered} producto${unanswered === 1 ? "" : "s"} por responder.`
      : totalSent <= 0
        ? "No hay nada que enviar. Si no tienes nada de lo pedido, cancela la solicitud con el motivo."
        : null;
  const busy = save.isPending || dispatch.isPending;
  const currentStep = unanswered > 0 ? 0 : reviewOpen ? 2 : 1;
  const error = save.error ?? dispatch.error;

  function update(productId: number, patch: Partial<EditorLine>) {
    setSaved(false);
    setLines((current) => current.map((line) => (line.productId === productId ? { ...line, ...patch } : line)));
  }

  function answerCategory(category: string) {
    setSaved(false);
    setLines((current) =>
      current.map((line) => (line.categoryName === category && line.sent === null ? { ...line, sent: line.requested } : line)),
    );
  }

  function markAllAvailable() {
    setSaved(false);
    setLines((current) => current.map((line) => (line.sent === null ? { ...line, sent: line.requested } : line)));
  }

  function handleAdd(quantities: Record<number, number>, items: StockRequestCatalogItem[]) {
    const additions: EditorLine[] = items
      .filter((item) => (quantities[item.productId] ?? 0) > 0)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        categoryName: item.categoryName,
        unit: item.unit,
        requested: 0,
        sent: quantities[item.productId],
        note: "",
        added: true,
      }));
    setSaved(false);
    setLines((current) => [...current, ...additions]);
    setAddOpen(false);
  }

  const exceptions = lines.filter((line) => ["partial", "none", "added"].includes(lineState(line)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <ProgressSteps
          steps={[
            { key: "responder", label: "Responde cada producto" },
            { key: "revisar", label: "Revisa el envío" },
            { key: "despachar", label: "Despacha" },
          ]}
          currentIndex={currentStep}
        />
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {unanswered > 0
              ? `Paso 1 · Para cada producto elige cuánto envías. Llevas ${answered} de ${lines.length}.`
              : "Paso 2 · Todo respondido. Pulsa “Revisar y despachar” para ver el resumen y enviarlo."}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={markAllAvailable} disabled={busy || unanswered === 0}>
            <CheckCheck className="size-3.5" aria-hidden="true" />
            Hay todo lo que falta
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setAddOpen(true)} disabled={busy}>
            <PackagePlus className="size-3.5" aria-hidden="true" />
            Agregar producto
          </Button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={lines.length} aria-valuenow={answered} aria-label="Productos respondidos">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${lines.length ? (answered / lines.length) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map((group) => {
          const done = group.items.filter((line) => line.sent !== null).length;
          const complete = done === group.items.length;
          return (
            <section key={group.category} className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center gap-2 bg-muted/60 px-3 py-2">
                {complete ? (
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
                <h3 className="flex-1 text-sm font-semibold text-foreground">{group.category}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {done}/{group.items.length} listos
                </span>
                {!complete && (
                  <Button type="button" size="xs" variant="outline" onClick={() => answerCategory(group.category)} disabled={busy}>
                    Hay todo aquí
                  </Button>
                )}
              </div>
              <ul className="divide-y divide-border">
                {group.items.map((line) => {
                  const state = lineState(line);
                  const style = STATE_STYLE[state];
                  return (
                    <li key={line.productId} className={cn("flex flex-col gap-2 border-l-4 px-3 py-3", style.bar, state === "pending" && "bg-amber-500/5")}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <div className="min-w-0 flex-1 basis-48">
                          <p className="text-sm font-semibold text-foreground">{line.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {line.added ? "Lo agregaste tú (la tienda no lo pidió)" : `La tienda pidió ${formatLineQuantity(line.requested, line.unit)}`}
                          </p>
                          <p className={cn("mt-0.5 text-xs font-semibold", style.text)}>{style.label(line)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {!line.added && (
                            <>
                              <Button type="button" size="sm" variant={state === "full" ? "default" : "outline"} onClick={() => update(line.productId, { sent: line.requested })} disabled={busy}>
                                Todo
                              </Button>
                              <Button type="button" size="sm" variant={state === "none" ? "destructive" : "outline"} onClick={() => update(line.productId, { sent: 0 })} disabled={busy}>
                                No hay
                              </Button>
                              <span className="text-xs text-muted-foreground">o cantidad:</span>
                            </>
                          )}
                          <QuantityStepper
                            value={line.sent}
                            onChange={(next) => update(line.productId, { sent: next })}
                            step={line.unit === "kg" ? 0.5 : 1}
                            ariaLabel={`Cantidad a enviar de ${line.productName}`}
                            disabled={busy}
                          />
                          {line.added && (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Quitar ${line.productName}`}
                              onClick={() => {
                                setSaved(false);
                                setLines((current) => current.filter((item) => item.productId !== line.productId));
                              }}
                              disabled={busy}
                            >
                              <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {(state === "partial" || state === "none" || line.note) && (
                        <Input
                          value={line.note}
                          onChange={(event) => update(line.productId, { note: event.target.value })}
                          maxLength={200}
                          placeholder={state === "none" ? "Aviso para la tienda (ej. sin existencia esta semana)" : "Aviso para la tienda (ej. solo hay la mitad)"}
                          aria-label={`Nota de ${line.productName}`}
                          className="h-8 text-xs"
                          disabled={busy}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
        <p className={cn("min-w-0 flex-1 text-sm", blockedReason ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>
          {blockedReason ?? (saved ? "Avance guardado. Puedes seguir después." : "Todo listo para revisar el envío.")}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => save.mutate({ id: request.id, payload: toPayload(lines, note) }, { onSuccess: () => setSaved(true) })}
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Guardar avance
          </Button>
          <Button type="button" disabled={busy || blockedReason !== null} onClick={() => setReviewOpen(true)}>
            <Truck className="size-4" aria-hidden="true" />
            Revisar y despachar
          </Button>
        </div>
      </div>

      <Dialog open={reviewOpen} onOpenChange={(next) => !dispatch.isPending && setReviewOpen(next)}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-4 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Truck className="size-5 text-primary" aria-hidden="true" />
              Revisa antes de despachar
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {request.code} · {request.storeName}. Así lo verá la tienda. Al despachar le llega el aviso de que va en camino.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Completos", value: counts.full, tone: "text-emerald-700 dark:text-emerald-300" },
              { label: "Parciales", value: counts.partial, tone: "text-sky-700 dark:text-sky-300" },
              { label: "No hay", value: counts.none, tone: "text-destructive" },
              { label: "Agregados", value: counts.added, tone: "text-violet-700 dark:text-violet-300" },
            ].map((tile) => (
              <div key={tile.label} className="rounded-lg border border-border p-2 text-center">
                <p className={cn("text-xl font-bold tabular-nums", tile.tone)}>{tile.value}</p>
                <p className="text-[11px] text-muted-foreground">{tile.label}</p>
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {exceptions.length === 0 ? (
              <p className="rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                Envío completo: sale todo lo que pidió la tienda.
              </p>
            ) : (
              <>
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  {isPartial ? "Envío parcial. Esto es lo que cambia:" : "Cambios en el envío:"}
                </p>
                <ul className="flex flex-col gap-1">
                  {exceptions.map((line) => {
                    const style = STATE_STYLE[lineState(line)];
                    return (
                      <li key={line.productId} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                        <span className="min-w-0 truncate text-foreground">{line.productName}</span>
                        <span className={cn("shrink-0 text-xs font-semibold", style.text)}>{style.label(line)}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plant-note" className="text-xs">
              Nota general para la tienda (opcional)
            </Label>
            <Textarea id="plant-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} placeholder="Ej. sale en el camión de las 3 pm" />
          </div>

          {dispatch.isError && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {dispatch.error.message}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={dispatch.isPending} onClick={() => setReviewOpen(false)}>
              Volver a editar
            </Button>
            <Button
              type="button"
              disabled={dispatch.isPending}
              onClick={() =>
                dispatch.mutate(
                  { id: request.id, payload: toPayload(lines, note) },
                  {
                    onSuccess: () => {
                      setReviewOpen(false);
                      onDone();
                    },
                  },
                )
              }
            >
              {dispatch.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Truck className="size-4" aria-hidden="true" />}
              Despachar ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddProductsDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        catalog={catalog ?? []}
        isLoading={catalogLoading}
        excludeIds={new Set(lines.map((line) => line.productId))}
        onAdd={handleAdd}
      />
    </div>
  );
}

interface AddProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: StockRequestCatalogItem[];
  isLoading: boolean;
  excludeIds: Set<number>;
  onAdd: (quantities: Record<number, number>, items: StockRequestCatalogItem[]) => void;
}

// Planta agrega productos que la tienda no pidió, con la cantidad que va a enviar.
function AddProductsDialog({ open, onOpenChange, catalog, isLoading, excludeIds, onAdd }: AddProductsDialogProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [wasOpen, setWasOpen] = useState(false);

  if (open && !wasOpen) {
    setWasOpen(true);
    setQuantities({});
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const count = Object.values(quantities).filter((quantity) => quantity > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Agregar productos al envío</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            Productos que la tienda no pidió. Indica cuánto vas a enviar de cada uno.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <CategoryProductPicker
            className="flex-1"
            items={catalog}
            excludeIds={excludeIds}
            isLoading={isLoading}
            quantities={quantities}
            onQuantityChange={(item, quantity) =>
              setQuantities((current) => {
                const next = { ...current };
                if (!quantity || quantity <= 0) delete next[item.productId];
                else next[item.productId] = quantity;
                return next;
              })
            }
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={count === 0} onClick={() => onAdd(quantities, catalog)}>
            Agregar {count > 0 ? `(${count})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
