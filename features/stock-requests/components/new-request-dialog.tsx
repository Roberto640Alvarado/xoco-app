"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardCheck, Eye, Loader2, MousePointerClick, PackagePlus, Send, Store, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HelpSteps } from "@/design-system/components/help-steps";
import { PreviewSheet } from "@/design-system/components/preview-sheet";
import { QuantityStepper } from "@/design-system/components/quantity-stepper";
import { SuccessCelebration } from "@/design-system/components/success-celebration";
import { formatDateTime } from "@/lib/format";
import { StoreSelect } from "@/components/filters/store-select";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useCreateStockRequest } from "../hooks/use-stock-request-actions";
import { useStockRequestCatalog } from "../hooks/use-stock-requests";
import { formatLineQuantity, groupByCategory } from "../lib/group-by-category";
import { CategoryProductPicker } from "./category-product-picker";
import type { StockRequestCatalogItem } from "../types/stock-request.types";

interface NewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName?: string;
  /** Admin: elige para qué tienda pide (el Vendedor siempre pide para la suya). */
  chooseStore?: boolean;
  onCreated?: (id: string) => void;
}

const ADMIN_HELP = [
  { icon: Store, title: "Elige la tienda", text: "Arriba, la tienda para la que pides el stock." },
  { icon: MousePointerClick, title: "Elige los productos", text: "Pulsa “Agregar” y pon cuántos quieres." },
  { icon: Send, title: "Envía a planta", text: "Revisa la vista previa y pulsa “Enviar a planta”." },
];

const HELP = [
  { icon: MousePointerClick, title: "Elige los productos", text: "Busca o toca una categoría y pulsa “Agregar”." },
  { icon: ClipboardCheck, title: "Pon cuántos quieres", text: "Usa − y + o escribe el número. Míralo en la vista previa." },
  { icon: Send, title: "Envía a planta", text: "Cuando esté como quieres, pulsa “Enviar a planta”." },
];

const NOTE_CHIPS = ["Es urgente", "Para el fin de semana", "Si no hay, mandar parecido"];

// Cuánto se muestra la pantalla de "¡Pedido enviado!" antes de cerrar.
const SUCCESS_MS = 2200;

// "Nueva solicitud" pensada para quien casi no usa computadora: arriba una
// guía de 3 pasos que avanza sola; a la izquierda se eligen los productos
// con botones grandes y a la derecha una vista previa en vivo ("así va tu
// pedido") que deja claro que todavía no se envía nada. Al enviar, una
// pantalla de "¡Listo!" confirma que planta ya lo recibió. En móvil son dos
// vistas: elegir y vista previa.
export function NewRequestDialog({ open, onOpenChange, storeName: ownStoreName, chooseStore = false, onCreated }: NewRequestDialogProps) {
  const create = useCreateStockRequest();
  const { data: stores, isLoading: storesLoading } = useStores();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(undefined);
  const storeName = chooseStore ? stores?.find((store) => store.id === posConfigId)?.name : ownStoreName;
  const reduce = useReducedMotion() ?? false;
  const { data: catalog, isLoading } = useStockRequestCatalog(open);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [view, setView] = useState<"elegir" | "revisar">("elegir");
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(false);

  // Ajuste de estado durante el render (patrón del proyecto): al abrir, formulario limpio.
  if (open && !wasOpen) {
    setWasOpen(true);
    setQuantities({});
    setNote("");
    setView("elegir");
    setSentCode(null);
    setPosConfigId(undefined);
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
  // Paso de la guía: 0 elegir, 1 ya hay productos (ajustar/revisar), 2 viendo la vista previa en móvil o con nota.
  const stepIndex = chooseStore
    ? posConfigId === undefined
      ? 0
      : count === 0
        ? 1
        : 2
    : count === 0
      ? 0
      : view === "revisar" || note.trim()
        ? 2
        : 1;
  const missingStore = chooseStore && posConfigId === undefined;

  function handleQuantity(item: StockRequestCatalogItem, quantity: number | null) {
    setQuantities((current) => {
      const next = { ...current };
      if (!quantity || quantity <= 0) delete next[item.productId];
      else next[item.productId] = quantity;
      return next;
    });
  }

  function addNoteChip(chip: string) {
    setNote((current) => (current.includes(chip) ? current : [current.trim(), chip].filter(Boolean).join(". ")));
  }

  function handleSubmit() {
    if (count === 0) return;
    create.mutate(
      {
        posConfigId: chooseStore ? posConfigId : undefined,
        note: note.trim() || undefined,
        lines: chosenItems.map((item) => ({ productId: item.productId, quantity: quantities[item.productId] })),
      },
      {
        onSuccess: (request) => {
          setSentCode(request.code);
          onCreated?.(request.id);
          setTimeout(() => onOpenChange(false), SUCCESS_MS);
        },
      },
    );
  }

  const disabledReason = missingStore
    ? "Elige la tienda para la que pides."
    : count === 0
      ? "Agrega al menos un producto para poder enviar."
      : null;

  const preview = (
    <PreviewSheet
      className="h-full"
      title="Así va tu pedido"
      subtitle={`${storeName ?? "Tu tienda"} · ${formatDateTime(new Date().toISOString())}`}
      badge={
        <motion.span
          key={count}
          initial={reduce ? false : { scale: 1.35 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground"
        >
          {count} producto{count === 1 ? "" : "s"}
        </motion.span>
      }
      footer={
        <div className="flex flex-col gap-2">
          <Label htmlFor="request-note" className="text-sm">
            ¿Algo más para planta? <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {NOTE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => addNoteChip(chip)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
              >
                + {chip}
              </button>
            ))}
          </div>
          <Textarea
            id="request-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Escribe aquí si quieres decirle algo a planta"
          />
        </div>
      }
    >
      {count === 0 ? (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Eye className="size-8" aria-hidden="true" />
          <p className="font-medium text-foreground">Aquí vas a ver tu pedido</p>
          <p className="max-w-56 text-xs">Cada producto que agregues aparece aquí, con su cantidad.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.category}>
              <p className="mb-1 border-b border-border pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{group.category}</p>
              <ul className="flex flex-col gap-1">
                <AnimatePresence initial={false}>
                  {group.items.map((item) => (
                    <motion.li
                      key={item.productId}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduce ? undefined : { opacity: 0, x: -16 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="flex flex-wrap items-center gap-2 py-1"
                    >
                      <span className="min-w-0 flex-1 basis-32 text-sm font-medium text-foreground">{item.productName}</span>
                      <QuantityStepper
                        value={quantities[item.productId]}
                        onChange={(next) => handleQuantity(item, next)}
                        step={item.unit === "kg" ? 0.5 : 1}
                        ariaLabel={`Cantidad de ${item.productName}`}
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Quitar ${item.productName}`}
                        title="Quitar del pedido"
                        onClick={() => handleQuantity(item, null)}
                      >
                        <Trash2 className="text-destructive" aria-hidden="true" />
                      </Button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ))}
        </div>
      )}
    </PreviewSheet>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && !sentCode && onOpenChange(next)}>
      <DialogContent className="flex h-[94vh] w-[calc(100vw-1.5rem)] flex-col gap-3 overflow-hidden sm:max-w-6xl">
        {sentCode ? (
          <div className="flex flex-1 items-center justify-center">
            <SuccessCelebration
              title="¡Pedido enviado!"
              description={
                <>
                  Tu solicitud <span className="font-mono font-semibold text-foreground">{sentCode}</span> ya le llegó a planta.
                  <br />
                  Te avisamos aquí cuando venga en camino.
                </>
              }
            />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                <PackagePlus className="size-6 text-primary" aria-hidden="true" />
                Pedir stock a planta
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                {storeName ? `Para ${storeName}. ` : ""}Sigue los 3 pasos. Nada se envía hasta que pulses “Enviar a planta”.
                {chooseStore && " La tienda confirma cuando le llegue, como siempre."}
              </DialogDescription>
            </DialogHeader>

            <HelpSteps steps={chooseStore ? ADMIN_HELP : HELP} currentIndex={stepIndex} />

            {chooseStore && (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5",
                  missingStore ? "border-amber-500/50 bg-amber-500/10" : "border-border bg-muted/30",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Store className="size-4" aria-hidden="true" />
                  ¿Para qué tienda es?
                </span>
                <StoreSelect
                  stores={stores}
                  isLoading={storesLoading}
                  value={posConfigId}
                  onChange={setPosConfigId}
                  hideAllStoresOption
                  className="w-full sm:w-64"
                />
              </div>
            )}

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className={cn("flex min-h-0 flex-col", view === "revisar" && "hidden lg:flex")} aria-label="Productos">
                <CategoryProductPicker
                  className="flex-1"
                  items={catalog ?? []}
                  quantities={quantities}
                  onQuantityChange={handleQuantity}
                  isLoading={isLoading}
                />
              </section>

              <aside className={cn("flex min-h-0 flex-col", view === "elegir" && "hidden lg:flex")} aria-label="Vista previa de tu pedido">
                {preview}
              </aside>
            </div>

            {create.isError && (
              <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {create.error.message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <p className={cn("text-sm", disabledReason ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>
                {disabledReason ??
                  `Vas a pedir ${count} producto${count === 1 ? "" : "s"}: ${chosenItems
                    .slice(0, 3)
                    .map((item) => `${item.productName} (${formatLineQuantity(quantities[item.productId], item.unit)})`)
                    .join(", ")}${count > 3 ? "..." : ""}`}
              </p>
              <div className="flex flex-wrap gap-2">
                {view === "revisar" && (
                  <Button type="button" variant="outline" size="lg" className="lg:hidden" onClick={() => setView("elegir")}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Seguir eligiendo
                  </Button>
                )}
                <Button type="button" variant="ghost" size="lg" onClick={() => onOpenChange(false)} disabled={create.isPending}>
                  Cancelar
                </Button>
                {view === "elegir" && (
                  <Button type="button" variant="secondary" size="lg" className="lg:hidden" disabled={count === 0} onClick={() => setView("revisar")}>
                    <Eye className="size-4" aria-hidden="true" />
                    Ver vista previa ({count})
                  </Button>
                )}
                <Button
                  type="button"
                  size="lg"
                  className={cn("min-w-44", view === "elegir" && "max-lg:hidden")}
                  onClick={handleSubmit}
                  disabled={create.isPending || count === 0 || missingStore}
                >
                  {create.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" aria-hidden="true" />
                      Enviar a planta
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
