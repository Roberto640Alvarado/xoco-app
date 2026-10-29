"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCheck,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  CornerDownRight,
  ListChecks,
  Loader2,
  PackagePlus,
  Repeat2,
  Save,
  Trash2,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HelpSteps } from "@/design-system/components/help-steps";
import { PreviewSheet } from "@/design-system/components/preview-sheet";
import { QuantityStepper } from "@/design-system/components/quantity-stepper";
import { useDispatchStockRequest, useSavePlantResponse } from "../hooks/use-stock-request-actions";
import { useStockRequestCatalog } from "../hooks/use-stock-requests";
import { formatLineQuantity, groupByCategory } from "../lib/group-by-category";
import { substitutesOf, withoutSubstitutes } from "../lib/substitution";
import { CategoryProductPicker } from "./category-product-picker";
import { RequestPreview, type PreviewLine } from "./request-preview";
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
  /** Solo en agregados: el producto pedido al que sustituye. */
  replacesProductId: number | null;
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
    replacesProductId: line.replacesProductId ?? null,
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
      replacesProductId: line.added ? line.replacesProductId : undefined,
    })),
  };
}

function toPreview(lines: EditorLine[]): PreviewLine[] {
  return lines.map((line) => ({ ...line }));
}

// Comentarios rápidos que planta pone a la par de un producto (Don Mario:
// "que pongan un comentario a la par: que no hay, o no sé, etc.").
const QUICK_NOTES = ["No hay", "Se acabó", "No sé", "Llega mañana", "Solo hay esto"];

const HELP = [
  { icon: ListChecks, title: "Marca cada producto", text: "“Hay todo”, “No hay” o pon cuánto mandas. Si no hay, puedes mandar otro." },
  { icon: ClipboardCheck, title: "Revisa la vista previa", text: "A la derecha ves cómo le va a llegar a la tienda." },
  { icon: Truck, title: "Despacha", text: "Pulsa “Revisar y despachar” y luego “Despachar ahora”." },
];

interface PlantResponseEditorProps {
  request: StockRequest;
  /** Se llama al despachar con éxito (el detalle muestra la animación y se cierra). */
  onDispatched: () => void;
}

type LineState = "pending" | "full" | "partial" | "none" | "added";

function lineState(line: EditorLine): LineState {
  if (line.sent === null) return "pending";
  if (line.added) return "added";
  if (line.sent === 0) return "none";
  if (line.sent < line.requested) return "partial";
  return "full";
}

const STATE_STYLE: Record<LineState, { bar: string; text: string; label: (line: EditorLine) => string }> = {
  pending: { bar: "border-l-amber-400", text: "text-amber-700 dark:text-amber-300", label: () => "Falta marcar" },
  full: { bar: "border-l-emerald-500", text: "text-emerald-700 dark:text-emerald-300", label: (l) => `Va todo (${formatLineQuantity(l.sent ?? 0, l.unit)})` },
  partial: {
    bar: "border-l-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    label: (l) => `Van ${formatLineQuantity(l.sent ?? 0, l.unit)} de ${formatLineQuantity(l.requested, l.unit)}`,
  },
  none: { bar: "border-l-destructive", text: "text-destructive", label: () => "No hay" },
  added: { bar: "border-l-violet-500", text: "text-violet-700 dark:text-violet-300", label: (l) => `Va ${formatLineQuantity(l.sent ?? 0, l.unit)}` },
};

interface NoteFieldProps {
  line: EditorLine;
  disabled: boolean;
  onChange: (note: string) => void;
}

// El comentario "a la par" de cada producto: un campo siempre visible y
// botones de comentario rápido para no tener que escribir.
function NoteField({ line, disabled, onChange }: NoteFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Comentario rápido:</span>
        {QUICK_NOTES.map((quick) => {
          const active = line.note.trim() === quick;
          return (
            <button
              key={quick}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange(active ? "" : quick)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary",
              )}
            >
              {quick}
            </button>
          );
        })}
      </div>
      <Input
        value={line.note}
        onChange={(event) => onChange(event.target.value)}
        maxLength={200}
        placeholder="O escribe un comentario para la tienda (opcional)"
        aria-label={`Comentario de ${line.productName}`}
        className="h-10 text-sm"
        disabled={disabled}
      />
    </div>
  );
}

// Planta responde la solicitud en tres pasos guiados (ver HELP). A la
// izquierda marca cada producto, con su comentario a la par y la opción de
// "Mandar otro en su lugar" (piden tiramisú, no hay, va brownie); a la
// derecha ve en vivo cómo le llega a la tienda. Los botones deshabilitados
// dicen por qué.
export function PlantResponseEditor({ request, onDispatched }: PlantResponseEditorProps) {
  const save = useSavePlantResponse();
  const dispatch = useDispatchStockRequest();
  const { data: catalog, isLoading: catalogLoading } = useStockRequestCatalog(true);

  const [lines, setLines] = useState<EditorLine[]>(() => toEditorLines(request));
  const [note, setNote] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<EditorLine | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const groups = useMemo(() => groupByCategory(withoutSubstitutes(lines)), [lines]);
  const answered = lines.filter((line) => line.sent !== null).length;
  const unanswered = lines.length - answered;
  const totalSent = lines.reduce((sum, line) => sum + (line.sent ?? 0), 0);
  const counts = useMemo(() => {
    const result: Record<LineState, number> = { pending: 0, full: 0, partial: 0, none: 0, added: 0 };
    for (const line of lines) result[lineState(line)] += 1;
    return result;
  }, [lines]);
  const replacedCount = lines.filter((line) => line.replacesProductId != null).length;
  const isPartial = counts.partial + counts.none > 0;
  const blockedReason =
    unanswered > 0
      ? `Faltan ${unanswered} producto${unanswered === 1 ? "" : "s"} por marcar.`
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

  function remove(productId: number) {
    setSaved(false);
    setLines((current) => current.filter((line) => line.productId !== productId));
  }

  function answerCategory(category: string) {
    setSaved(false);
    setLines((current) =>
      current.map((line) => (line.categoryName === category && line.sent === null && !line.added ? { ...line, sent: line.requested } : line)),
    );
  }

  function markAllAvailable() {
    setSaved(false);
    setLines((current) => current.map((line) => (line.sent === null && !line.added ? { ...line, sent: line.requested } : line)));
  }

  function chosenFrom(quantities: Record<number, number>, items: StockRequestCatalogItem[]) {
    return items.filter((item) => (quantities[item.productId] ?? 0) > 0);
  }

  function handleAdd(quantities: Record<number, number>, items: StockRequestCatalogItem[]) {
    const additions: EditorLine[] = chosenFrom(quantities, items).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      categoryName: item.categoryName,
      unit: item.unit,
      requested: 0,
      sent: quantities[item.productId],
      note: "",
      added: true,
      replacesProductId: null,
    }));
    setSaved(false);
    setLines((current) => [...current, ...additions]);
    setAddOpen(false);
  }

  // "Mandar otro en su lugar": agrega el/los sustitutos ligados al producto
  // pedido y, si no estaba respondido, lo marca como "No hay" con su nota.
  function handleReplace(quantities: Record<number, number>, items: StockRequestCatalogItem[]) {
    if (!replaceTarget) return;
    const chosen = chosenFrom(quantities, items);
    const target = replaceTarget;
    const names = chosen.map((item) => item.productName).join(" y ");
    setSaved(false);
    setLines((current) => [
      ...current.map((line) =>
        line.productId === target.productId
          ? {
              ...line,
              sent: line.sent ?? 0,
              note: line.note.trim() ? line.note : `No hay, va ${names} en su lugar`,
            }
          : line,
      ),
      ...chosen.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        categoryName: item.categoryName,
        unit: item.unit,
        requested: 0,
        sent: quantities[item.productId],
        note: "",
        added: true,
        replacesProductId: target.productId,
      })),
    ]);
    setReplaceTarget(null);
  }

  const exceptions = lines.filter((line) => ["partial", "none", "added"].includes(lineState(line)));
  const nameById = new Map(lines.map((line) => [line.productId, line.productName]));

  return (
    <div className="flex flex-col gap-4">
      <HelpSteps steps={HELP} currentIndex={currentStep} />

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {unanswered > 0 ? `Llevas ${answered} de ${lines.length} productos marcados.` : "¡Todo marcado! Revisa la vista previa y despacha."}
          </p>
          <Button type="button" variant="outline" onClick={markAllAvailable} disabled={busy || unanswered === 0}>
            <CheckCheck className="size-4" aria-hidden="true" />
            Hay todo lo que falta
          </Button>
          <Button type="button" variant="outline" onClick={() => setAddOpen(true)} disabled={busy}>
            <PackagePlus className="size-4" aria-hidden="true" />
            Agregar producto extra
          </Button>
          <Link
            href={`/dashboard/inventario?tienda=${request.posConfigId}`}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "ghost" })}
          >
            <Warehouse className="size-4" aria-hidden="true" />
            Ver inventario de {request.storeName}
          </Link>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={lines.length}
          aria-valuenow={answered}
          aria-label="Productos marcados"
        >
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${lines.length ? (answered / lines.length) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-3">
          {request.note && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
              <span className="font-semibold">La tienda dice:</span> “{request.note}”
            </p>
          )}
          {groups.map((group) => {
            const done = group.items.filter((line) => line.sent !== null).length;
            const complete = done === group.items.length;
            return (
              <section key={group.category} className="overflow-hidden rounded-xl border border-border">
                <div className="flex flex-wrap items-center gap-2 bg-muted/60 px-3 py-2">
                  {complete ? (
                    <CheckCircle2 className="size-5 text-emerald-600" aria-label="Categoría lista" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground" aria-label="Categoría pendiente" />
                  )}
                  <h3 className="flex-1 text-sm font-bold text-foreground">{group.category}</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {done}/{group.items.length} listos
                  </span>
                  {!complete && (
                    <Button type="button" size="sm" variant="outline" onClick={() => answerCategory(group.category)} disabled={busy}>
                      Hay todo aquí
                    </Button>
                  )}
                </div>
                <ul className="divide-y divide-border">
                  {group.items.map((line) => {
                    const state = lineState(line);
                    const style = STATE_STYLE[state];
                    const subs = substitutesOf(line.productId, lines);
                    const missing = state === "none" || state === "partial";
                    return (
                      <li
                        key={line.productId}
                        className={cn("flex flex-col gap-3 border-l-4 px-3 py-3", style.bar, state === "pending" && "bg-amber-500/5")}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <div className="min-w-0 flex-1 basis-48">
                            <p className="text-base font-semibold text-foreground">{line.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {line.added ? "Extra: la tienda no lo pidió" : (
                                <>
                                  La tienda pidió <span className="font-bold text-foreground">{formatLineQuantity(line.requested, line.unit)}</span>
                                </>
                              )}
                            </p>
                            <p className={cn("mt-0.5 text-sm font-semibold", style.text)}>
                              {style.label(line)}
                              {subs.length > 0 && ` · va ${subs.map((sub) => sub.productName).join(" y ")} en su lugar`}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {!line.added && (
                              <>
                                <Button
                                  type="button"
                                  variant={state === "full" ? "default" : "outline"}
                                  className={cn(state === "full" && "bg-emerald-600 text-white hover:bg-emerald-600/90")}
                                  onClick={() => update(line.productId, { sent: line.requested })}
                                  disabled={busy}
                                  aria-pressed={state === "full"}
                                >
                                  <CheckCheck className="size-4" aria-hidden="true" />
                                  Hay todo
                                </Button>
                                <Button
                                  type="button"
                                  variant={state === "none" ? "destructive" : "outline"}
                                  onClick={() => update(line.productId, { sent: 0 })}
                                  disabled={busy}
                                  aria-pressed={state === "none"}
                                >
                                  <X className="size-4" aria-hidden="true" />
                                  No hay
                                </Button>
                                <span className="text-xs text-muted-foreground">o pon cuánto:</span>
                              </>
                            )}
                            <QuantityStepper
                              value={line.sent}
                              onChange={(next) => update(line.productId, { sent: next })}
                              step={line.unit === "kg" ? 0.5 : 1}
                              ariaLabel={`Cantidad a enviar de ${line.productName}`}
                              disabled={busy}
                              size="lg"
                            />
                            {line.added && (
                              <Button type="button" size="icon" variant="ghost" aria-label={`Quitar ${line.productName}`} onClick={() => remove(line.productId)} disabled={busy}>
                                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <NoteField line={line} disabled={busy} onChange={(value) => update(line.productId, { note: value })} />

                        {!line.added && (
                          <Button
                            type="button"
                            variant={missing && subs.length === 0 ? "secondary" : "ghost"}
                            className="self-start"
                            onClick={() => setReplaceTarget(line)}
                            disabled={busy}
                          >
                            <Repeat2 className="size-4" aria-hidden="true" />
                            {subs.length > 0 ? "Mandar otro más en su lugar" : "Mandar otro en su lugar"}
                          </Button>
                        )}

                        {subs.map((sub) => (
                          <div key={sub.productId} className="ml-2 flex flex-col gap-2 rounded-xl border border-violet-500/40 bg-violet-500/5 p-3 sm:ml-6">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                              <div className="min-w-0 flex-1 basis-40">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                                  <CornerDownRight className="size-3.5" aria-hidden="true" />
                                  En lugar de {line.productName}
                                </p>
                                <p className="text-base font-semibold text-foreground">{sub.productName}</p>
                              </div>
                              <QuantityStepper
                                value={sub.sent}
                                onChange={(next) => update(sub.productId, { sent: next })}
                                step={sub.unit === "kg" ? 0.5 : 1}
                                ariaLabel={`Cantidad a enviar de ${sub.productName}`}
                                disabled={busy}
                                size="lg"
                              />
                              <Button type="button" size="icon" variant="ghost" aria-label={`Quitar ${sub.productName}`} onClick={() => remove(sub.productId)} disabled={busy}>
                                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                              </Button>
                            </div>
                            <NoteField line={sub} disabled={busy} onChange={(value) => update(sub.productId, { note: value })} />
                          </div>
                        ))}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-0 lg:max-h-[70vh] lg:self-start">
          <PreviewSheet
            className="lg:max-h-[70vh]"
            title="Así le llega a la tienda"
            subtitle={`${request.code} · ${request.storeName}`}
            badge={
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground tabular-nums">
                {answered}/{lines.length}
              </span>
            }
            footer={
              <p className="text-xs text-muted-foreground">
                {counts.full} completos · {counts.partial} parciales · {counts.none} no hay · {counts.added} extra
                {replacedCount > 0 ? ` (${replacedCount} en lugar de otro)` : ""}
              </p>
            }
          >
            <RequestPreview lines={toPreview(lines)} mode="response" emptyText="Esta solicitud no tiene productos." />
          </PreviewSheet>
        </aside>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
        <p className={cn("min-w-0 flex-1 text-sm font-medium", blockedReason ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300")}>
          {blockedReason ?? (saved ? "Avance guardado. Puedes seguir después." : "Todo listo: revisa y despacha.")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => save.mutate({ id: request.id, payload: toPayload(lines, note) }, { onSuccess: () => setSaved(true) })}
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Guardar avance
          </Button>
          <Button type="button" size="lg" disabled={busy || blockedReason !== null} onClick={() => setReviewOpen(true)}>
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
              ¿Todo bien? Revisa antes de despachar
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {request.code} · {request.storeName}. Al despachar, a la tienda le llega el aviso de que va en camino.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Completos", value: counts.full, tone: "text-emerald-700 dark:text-emerald-300" },
              { label: "Parciales", value: counts.partial, tone: "text-sky-700 dark:text-sky-300" },
              { label: "No hay", value: counts.none, tone: "text-destructive" },
              { label: "Extra / en su lugar", value: counts.added, tone: "text-violet-700 dark:text-violet-300" },
            ].map((tile) => (
              <div key={tile.label} className="rounded-lg border border-border p-2 text-center">
                <p className={cn("text-2xl font-bold tabular-nums", tile.tone)}>{tile.value}</p>
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
                    const replaces = line.replacesProductId != null ? nameById.get(line.replacesProductId) : null;
                    return (
                      <li key={line.productId} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                        <span className="min-w-0 text-foreground">
                          {line.productName}
                          {replaces && <span className="block text-[11px] text-violet-700 dark:text-violet-300">en lugar de {replaces}</span>}
                          {line.note.trim() && <span className="block text-[11px] text-muted-foreground italic">“{line.note.trim()}”</span>}
                        </span>
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
            <Button type="button" variant="outline" size="lg" disabled={dispatch.isPending} onClick={() => setReviewOpen(false)}>
              Volver a editar
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={dispatch.isPending}
              onClick={() =>
                dispatch.mutate(
                  { id: request.id, payload: toPayload(lines, note) },
                  {
                    onSuccess: () => {
                      setReviewOpen(false);
                      onDispatched();
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

      <PickProductsDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Agregar producto extra"
        description="Productos que la tienda no pidió. Toca “Agregar” y pon cuánto vas a mandar."
        confirmLabel="Agregar al envío"
        catalog={catalog ?? []}
        isLoading={catalogLoading}
        excludeIds={new Set(lines.map((line) => line.productId))}
        onConfirm={handleAdd}
      />

      <PickProductsDialog
        open={replaceTarget !== null}
        onOpenChange={(next) => !next && setReplaceTarget(null)}
        title={replaceTarget ? `¿Qué mandas en lugar de ${replaceTarget.productName}?` : ""}
        description={
          replaceTarget
            ? `La tienda pidió ${formatLineQuantity(replaceTarget.requested, replaceTarget.unit)}. Elige el producto que va en su lugar y cuánto mandas. La tienda verá que va “en lugar de” ${replaceTarget.productName}.`
            : ""
        }
        confirmLabel="Mandar en su lugar"
        catalog={catalog ?? []}
        isLoading={catalogLoading}
        excludeIds={new Set(lines.map((line) => line.productId))}
        defaultCategory={replaceTarget?.categoryName}
        onConfirm={handleReplace}
      />
    </div>
  );
}

interface PickProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  catalog: StockRequestCatalogItem[];
  isLoading: boolean;
  excludeIds: Set<number>;
  /** Categoría que se abre primero (ej. la del producto que se reemplaza). */
  defaultCategory?: string;
  onConfirm: (quantities: Record<number, number>, items: StockRequestCatalogItem[]) => void;
}

// Elegir productos del catálogo con su cantidad: para agregar extras o para
// "mandar otro en su lugar".
function PickProductsDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  catalog,
  isLoading,
  excludeIds,
  defaultCategory,
  onConfirm,
}: PickProductsDialogProps) {
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
      <DialogContent className="flex h-[88vh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <CategoryProductPicker
            key={defaultCategory ?? "all"}
            className="flex-1"
            items={catalog}
            excludeIds={excludeIds}
            isLoading={isLoading}
            defaultCategory={defaultCategory}
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
          <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" size="lg" disabled={count === 0} onClick={() => onConfirm(quantities, catalog)}>
            {confirmLabel} {count > 0 ? `(${count})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
