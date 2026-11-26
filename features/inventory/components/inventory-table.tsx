"use client";

import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  History,
  Info,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "cn";
import { DataTable, type DataTableColumn } from "@/design-system/components/data-table";
import { DateTimePicker, toLocalDateTime } from "@/design-system/components/date-time-picker";
import { InfoBadge } from "@/design-system/components/info-badge";
import { SegmentedControl } from "@/design-system/components/segmented-control";
import { ValueBox } from "@/design-system/components/value-box";
import { Input } from "@/components/ui/input";
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
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { formatDateTime, formatInteger, formatKg } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUpsertInventoryBulk } from "../hooks/use-upsert-inventory-bulk";
import type { InventoryItem, InventoryUnit } from "../types/inventory.types";

const COUNT_INPUT_SELECTOR = "input[data-count-input]";
const SAVE_BUTTON_SELECTOR = '[data-tour="inv-save"]';

// Redondeo a 3 decimales (gramos) para no mostrar residuos de punto flotante.
function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function isValidDraft(value: string): boolean {
  if (value.trim() === "") return true; // vacío = "no tocar este producto", válido
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0;
}

function formatQuantity(quantity: number, unit: InventoryUnit): string {
  return unit === "kg" ? formatKg(quantity) : `${formatInteger(quantity)} u`;
}

// Sin mayúsculas ni tildes: "maranon" encuentra "Marañon".
function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function focusFirstCountInput() {
  const first = Array.from(document.querySelectorAll<HTMLInputElement>(COUNT_INPUT_SELECTOR)).find(
    (input) => input.offsetParent !== null,
  );
  first?.focus();
  first?.select();
}

// Buscador de la barra de Conteo: filtra por producto o categoría cuando se
// deja de escribir (lo hace InventoryTable con useDebouncedValue). Enter
// salta al primer campo de conteo de los resultados; Escape lo limpia.
function ProductSearch({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit: () => void }) {
  return (
    <div className="relative w-full sm:w-80 lg:w-96">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
          if (event.key === "Escape") onChange("");
        }}
        placeholder="Buscar producto o categoría..."
        aria-label="Buscar producto o categoría"
        enterKeyHint="search"
        className="h-8 pr-8 pl-8 text-sm [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-1.5 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function unitLabel(unit: InventoryUnit): string {
  return unit === "kg" ? "Kg" : "u";
}

// Pasa el foco al campo de conteo anterior/siguiente que esté visible (la
// tabla de escritorio y las tarjetas de móvil existen a la vez en el DOM).
// Al terminar la página, el foco va a "Guardar cambios".
function focusSiblingInput(current: HTMLInputElement, step: 1 | -1) {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(COUNT_INPUT_SELECTOR)).filter(
    (input) => input.offsetParent !== null,
  );
  const next = inputs[inputs.indexOf(current) + step];
  if (next) {
    next.focus();
    next.select();
    return;
  }
  if (step === 1) document.querySelector<HTMLButtonElement>(SAVE_BUTTON_SELECTOR)?.focus();
}

interface DirtyEntry {
  productId: number;
  productName: string;
  unit: InventoryUnit;
  quantity: number;
  estimatedQuantity: number | null;
}

// Cuánto se aleja lo contado de lo estimado: cuadra (✓), sobra (+) o falta
// (−). El ícono y el texto repiten el sentido para no depender del color.
function DifferenceBadge({ counted, estimated, unit }: { counted: number; estimated: number | null; unit: InventoryUnit }) {
  if (estimated == null) {
    return (
      <InfoBadge tone="info" icon={Sparkles} size="sm">
        Primer conteo
      </InfoBadge>
    );
  }
  const diff = roundQuantity(counted - estimated);
  if (diff === 0) {
    return (
      <InfoBadge tone="success" icon={Check} size="sm">
        Cuadra
      </InfoBadge>
    );
  }
  return diff > 0 ? (
    <InfoBadge tone="info" icon={ArrowUpRight} size="sm">
      Sobran {formatQuantity(diff, unit)}
    </InfoBadge>
  ) : (
    <InfoBadge tone="warning" icon={ArrowDownRight} size="sm">
      Faltan {formatQuantity(Math.abs(diff), unit)}
    </InfoBadge>
  );
}

// Cuándo se contó: por defecto "ahora"; si se contó antes (ej. antes de abrir
// la tienda o el fin de semana) y se está pasando más tarde, se elige esa
// fecha y hora para que las ventas de en medio sí se resten del conteo. Va
// arriba de la tabla para que se elija ANTES de capturar. El backend acepta
// hasta 7 días atrás y nada en el futuro (resolveCountedAt en xoco-api).
function CountedAtField({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const now = new Date();
  const custom = value !== "";
  return (
    <div className="flex flex-wrap items-center gap-2" data-tour="inv-counted-at">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
        ¿Cuándo contaron?
      </span>
      <fieldset disabled={disabled} className="contents">
        <SegmentedControl
          ariaLabel="Fecha del conteo"
          value={custom ? "custom" : "now"}
          onChange={(next) => onChange(next === "now" ? "" : toLocalDateTime(new Date(now.getTime() - 60 * 60 * 1000)))}
          options={[
            { value: "now", label: "Ahora" },
            { value: "custom", label: "Otra fecha" },
          ]}
        />
        {custom && (
          <DateTimePicker
            value={value}
            onChange={onChange}
            min={new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}
            max={now}
            disabled={disabled}
            ariaLabel="Fecha y hora del conteo"
          />
        )}
      </fieldset>
    </div>
  );
}

interface ConfirmSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName?: string;
  entries: DirtyEntry[];
  /** Productos nunca contados que se dejaron vacíos: se guardan en 0. */
  zeroFillCount: number;
  /** "" = ahora; si no, un datetime-local con la hora real del conteo. */
  countedAt: string;
  upsert: ReturnType<typeof useUpsertInventoryBulk>;
  onConfirm: () => void;
}

// Panel de confirmación antes de guardar — pedido explícito del usuario
// ("las cosas de guardar siempre con un panel de confirmación"). Muestra,
// por producto, lo estimado → lo contado y si cuadra, para revisar antes de
// reemplazar.
function ConfirmSaveDialog({ open, onOpenChange, storeName, entries, zeroFillCount, countedAt, upsert, onConfirm }: ConfirmSaveDialogProps) {
  const total = entries.length + zeroFillCount;
  return (
    <Dialog open={open} onOpenChange={(next) => !upsert.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Revisa antes de guardar</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            Vas a guardar {total} {total === 1 ? "producto" : "productos"}
            {storeName ? (
              <>
                {" "}
                en <span className="font-medium text-foreground">{storeName}</span>
              </>
            ) : null}
            . Cada cantidad reemplaza el conteo anterior.
          </DialogDescription>
        </DialogHeader>

        {upsert.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            Inventario guardado correctamente.
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <p className="text-foreground">
                Contado:{" "}
                <span className="font-semibold">{countedAt ? formatDateTime(new Date(countedAt).toISOString()) : "ahora mismo"}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Las ventas y movimientos desde esa hora se restan o suman a lo contado.</p>
            </div>
            {zeroFillCount > 0 && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
                Además, <span className="font-semibold">{zeroFillCount} producto{zeroFillCount === 1 ? "" : "s"}</span> sin conteo previo{" "}
                {zeroFillCount === 1 ? "quedó vacío y se guardará" : "quedaron vacíos y se guardarán"} en <span className="font-semibold">0</span> (no hay).
              </p>
            )}
            {entries.length > 0 && (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                <div className="sticky top-0 flex justify-between gap-3 border-b border-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                  <span>Producto</span>
                  <span>Estimada → Contado</span>
                </div>
                <ul className="divide-y divide-border">
                  {entries.map((entry) => (
                    <li
                      key={entry.productId}
                      className="flex flex-col gap-1 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <span className="text-foreground">{entry.productName}</span>
                      <span className="flex shrink-0 items-center justify-end gap-2 tabular-nums">
                        <span className="text-muted-foreground">
                          {entry.estimatedQuantity != null ? formatQuantity(roundQuantity(entry.estimatedQuantity), entry.unit) : "—"}
                        </span>
                        <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="font-semibold text-foreground">{formatQuantity(entry.quantity, entry.unit)}</span>
                        <DifferenceBadge counted={entry.quantity} estimated={entry.estimatedQuantity} unit={entry.unit} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {upsert.isError && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {upsert.error.message}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={upsert.isPending}>
            Seguir editando
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
              "Confirmar y guardar"
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
  /** Vendedor/Planta: solo ven la existencia estimada — sin la columna de
   * captura ni el botón de guardar (el backend tampoco les deja escribir). */
  readOnly?: boolean;
  /** Avisa los productos que quedan tras la búsqueda y los filtros de la
   * tabla (todas las páginas), para que "Exportar" respete lo filtrado. */
  onFilteredItemsChange?: (items: InventoryItem[]) => void;
}

// Tabla de captura del conteo físico por tienda. Cada producto muestra
// "Existencia estimada" (solo lectura: último conteo − ventas − mermas/
// regalías/degustaciones + entradas confirmadas) y "Conteo físico", un campo
// VACÍO donde se escribe lo que hay hoy (la estimada sale de referencia en el
// placeholder). Lo escrito reemplaza el conteo anterior y se compara al
// momento contra la estimada (Cuadra / Sobran / Faltan). Para llenar rápido:
// Enter o ↓ pasa al siguiente producto, ↑ al anterior, "Usar estimada" copia
// la estimada cuando cuadra, y la tabla arranca con 50 filas por página. Se
// guarda en LOTE con confirmación. Los borradores viven aquí, así que se
// conservan al cambiar de página o filtrar.
export function InventoryTable({
  posConfigId,
  storeName,
  items,
  isLoading,
  isError,
  errorMessage,
  readOnly = false,
  onFilteredItemsChange,
}: InventoryTableProps) {
  const upsert = useUpsertInventoryBulk();
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [countedAt, setCountedAt] = useState("");
  const [search, setSearch] = useState("");
  // Busca cuando se deja de escribir (300 ms), no en cada tecla.
  const debouncedSearch = useDebouncedValue(search, 300);
  // Enter aplica la búsqueda al instante, sin esperar el debounce.
  const [appliedSearch, setAppliedSearch] = useState("");
  const [lastDebounced, setLastDebounced] = useState(debouncedSearch);
  if (debouncedSearch !== lastDebounced) {
    setLastDebounced(debouncedSearch);
    setAppliedSearch(debouncedSearch);
  }
  if (search === "" && appliedSearch !== "") setAppliedSearch("");

  const visibleItems = useMemo(() => {
    const term = normalizeSearch(appliedSearch);
    if (!term) return items;
    return items.filter((item) => normalizeSearch(`${item.productName} ${item.categoryName}`).includes(term));
  }, [items, appliedSearch]);

  // Si se cambia de tienda, los drafts de la tienda anterior ya no
  // aplican — "ajustar estado durante el render" en vez de un useEffect.
  const [lastPosConfigId, setLastPosConfigId] = useState(posConfigId);
  if (posConfigId !== lastPosConfigId) {
    setLastPosConfigId(posConfigId);
    setDrafts({});
    setConfirmOpen(false);
    setSearch("");
    upsert.reset();
  }

  function draftValue(item: InventoryItem): string {
    return drafts[item.productId] ?? "";
  }

  function setDraft(productId: number, value: string) {
    setDrafts((prev) => ({ ...prev, [productId]: value }));
  }

  // Todo lo escrito es un conteo nuevo, aunque sea el mismo número del conteo
  // anterior: recontar reinicia desde ahí la existencia estimada.
  const dirtyEntries: DirtyEntry[] = items.flatMap((item) => {
    const value = drafts[item.productId] ?? "";
    if (item.recipe || value.trim() === "" || !isValidDraft(value)) return [];
    return [
      {
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        quantity: Number(value),
        estimatedQuantity: item.estimatedQuantity,
      },
    ];
  });

  // Un producto que nunca se ha contado y se deja vacío se guarda en 0 ("no
  // hay"): así solo se escribe lo que sí hay. Un producto que YA tenía conteo
  // y se deja vacío no se toca (conserva su valor).
  const zeroFillEntries: DirtyEntry[] = items
    .filter((item) => item.recipe === null && item.quantity === null && (drafts[item.productId] ?? "").trim() === "")
    .map((item) => ({ productId: item.productId, productName: item.productName, unit: item.unit, quantity: 0, estimatedQuantity: null }));

  const hasInvalidDraft = Object.values(drafts).some((value) => !isValidDraft(value));
  const canOpenConfirm = dirtyEntries.length + zeroFillEntries.length > 0 && !hasInvalidDraft;
  const hasUnsaved = dirtyEntries.length > 0;

  // Aviso del navegador si se cierra o recarga con conteos sin guardar.
  useEffect(() => {
    if (!hasUnsaved) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved]);

  function handleOpenConfirm() {
    if (!canOpenConfirm) return;
    upsert.reset();
    setConfirmOpen(true);
  }

  function handleConfirm() {
    upsert.mutate(
      {
        posConfigId,
        entries: [...dirtyEntries, ...zeroFillEntries].map(({ productId, quantity }) => ({ productId, quantity })),
        countedAt: countedAt ? new Date(countedAt).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          setDrafts({});
          setCountedAt("");
          setTimeout(() => setConfirmOpen(false), 1200);
        },
      },
    );
  }

  function handleCountKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    const goNext = (event.key === "Enter" && !event.shiftKey) || event.key === "ArrowDown";
    const goPrev = (event.key === "Enter" && event.shiftKey) || event.key === "ArrowUp";
    if (!goNext && !goPrev) return;
    event.preventDefault(); // ↑/↓ no suben ni bajan el número por accidente
    focusSiblingInput(event.currentTarget, goNext ? 1 : -1);
  }

  // Funciones de render (no componentes) para que el input no se remonte —y
  // pierda el foco— en cada tecla.
  function renderEstimated(item: InventoryItem) {
    if (item.recipe) {
      return (
        <div className="flex justify-end">
          <InfoBadge tone="violet" size="sm">
            Por receta
          </InfoBadge>
        </div>
      );
    }
    return (
      <div className="flex justify-end">
        <div className="relative">
          <ValueBox
            aria-label={`Existencia estimada de ${item.productName}`}
            value={item.estimatedQuantity != null ? String(roundQuantity(item.estimatedQuantity)) : null}
            className="w-28 pr-9"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
            {unitLabel(item.unit)}
          </span>
        </div>
      </div>
    );
  }

  // Línea discreta bajo el nombre del producto: último conteo, cuándo y
  // quién (solo el usuario del correo; el correo completo en el title).
  function renderLastCount(item: InventoryItem) {
    const date = item.countedAt ?? item.updatedAt;
    if (item.recipe) return null;
    if (item.quantity == null || !date) {
      return <span className="text-xs text-muted-foreground">Nunca contado</span>;
    }
    const who = item.updatedByEmail?.split("@")[0];
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground" title={item.updatedByEmail ?? undefined}>
        <History className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          Último conteo <span className="font-medium text-foreground/80">{formatQuantity(item.quantity, item.unit)}</span> ·{" "}
          {formatDateTime(date)}
          {who && <> · {who}</>}
        </span>
      </span>
    );
  }

  function renderNewQuantity(item: InventoryItem) {
    // Producto con receta: no se cuenta; sus ventas descuentan sus ingredientes.
    if (item.recipe) {
      return (
        <p className="ml-auto max-w-56 text-right text-xs text-muted-foreground">
          No se cuenta. Cada venta descuenta{" "}
          {item.recipe.components.map((component) => `${component.quantity} ${component.productName}`).join(", ")}.
        </p>
      );
    }
    const value = draftValue(item);
    const invalid = !isValidDraft(value);
    const typed = value.trim() !== "" && !invalid;
    const estimated = item.estimatedQuantity != null ? roundQuantity(item.estimatedQuantity) : null;
    // Se ofrece copiar la estimada solo si es un número que se puede contar.
    const canUseEstimated = estimated != null && estimated >= 0;
    const placeholder = canUseEstimated ? String(estimated) : "0";

    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center justify-end gap-2">
          {/* Lado izquierdo del campo: la diferencia si ya se escribió, o el atajo para copiar la estimada. */}
          {typed ? (
            <DifferenceBadge counted={Number(value)} estimated={item.estimatedQuantity} unit={item.unit} />
          ) : canUseEstimated ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              tabIndex={-1}
              onClick={() => setDraft(item.productId, String(estimated))}
              aria-label={`Usar la existencia estimada (${estimated}) como conteo de ${item.productName}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Check className="size-3" aria-hidden="true" />
              Usar estimada
            </Button>
          ) : null}
          <div className="relative">
            <Input
              type="number"
              inputMode={item.unit === "kg" ? "decimal" : "numeric"}
              enterKeyHint="next"
              min={0}
              step={item.unit === "kg" ? "0.001" : "1"}
              placeholder={placeholder}
              value={value}
              onChange={(event) => setDraft(item.productId, event.target.value)}
              onKeyDown={handleCountKeyDown}
              onFocus={(event) => event.currentTarget.select()}
              onWheel={(event) => event.currentTarget.blur()}
              data-count-input=""
              aria-invalid={invalid}
              aria-label={`Conteo físico de ${item.productName}`}
              className={cn(
                "w-28 border-foreground/30 bg-background pr-9 text-right font-semibold tabular-nums placeholder:font-normal placeholder:text-muted-foreground/60",
                "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                typed && "border-primary ring-1 ring-primary/30",
                invalid && "border-destructive ring-destructive/30",
              )}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
              {unitLabel(item.unit)}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            tabIndex={-1}
            onClick={() => setDraft(item.productId, "")}
            aria-label={`Deshacer el conteo de ${item.productName}`}
            className={cn("text-muted-foreground", !typed && "invisible")}
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
        {invalid && <span className="text-xs text-destructive">Escribe un número mayor o igual a 0.</span>}
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
      cell: (item) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">{item.productName}</span>
          {renderLastCount(item)}
        </div>
      ),
      accessor: (item) => item.productName,
      filter: "text",
      mobile: "title",
    },
    {
      id: "category",
      header: "Categoría",
      label: "Categoría",
      cell: (item) => <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{item.categoryName}</span>,
      accessor: (item) => item.categoryName,
      filter: "select",
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
          <span className="block text-[10px] font-normal text-muted-foreground">lo que debería haber hoy</span>
        </>
      ),
      label: "Existencia estimada",
      cell: (item) => renderEstimated(item),
      accessor: (item) => (item.recipe ? "Por receta" : item.estimatedQuantity != null ? "Contado" : "Sin contar"),
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
                Conteo físico
                <span className="block text-[10px] font-normal text-muted-foreground">lo que hay hoy · reemplaza el anterior</span>
              </>
            ),
            label: "Conteo físico",
            cell: (item: InventoryItem) => renderNewQuantity(item),
            accessor: (item: InventoryItem) => {
              if (item.recipe) return "Por receta";
              if ((drafts[item.productId] ?? "").trim() !== "") return "Escritos ahora";
              return item.quantity == null ? "Nunca contados" : "Sin escribir";
            },
            filter: "select" as const,
            align: "right" as const,
            className: "min-w-72",
            tourId: "inv-count",
          },
        ]),
  ];

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <CountedAtField value={countedAt} onChange={setCountedAt} disabled={upsert.isPending} />
            <ProductSearch
              value={search}
              onChange={setSearch}
              onSubmit={() => {
                setAppliedSearch(search);
                // Espera al render con los resultados para enfocar el primero.
                setTimeout(focusFirstCountInput, 0);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {hasUnsaved && (
              <InfoBadge tone="info" dot>
                {dirtyEntries.length} por guardar
              </InfoBadge>
            )}
            {zeroFillEntries.length > 0 && (
              <InfoBadge tone="warning" dot>
                {zeroFillEntries.length} sin conteo se guardará{zeroFillEntries.length === 1 ? "" : "n"} en 0
              </InfoBadge>
            )}
            <Button type="button" onClick={handleOpenConfirm} disabled={!canOpenConfirm} data-tour="inv-save">
              Guardar cambios
            </Button>
          </div>
        </div>
      )}

      {!readOnly && (
        <p className="flex items-start gap-1.5 px-1 text-xs text-muted-foreground">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="hidden md:inline">
              <kbd className="rounded border border-border bg-muted px-1 font-sans">Enter</kbd> pasa al siguiente producto.{" "}
            </span>
            ¿Llegó producto de planta? No lo sumes aquí: regístralo como Entrada en Movimientos.
          </span>
        </p>
      )}

      {isError ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <ChartErrorState message={errorMessage} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleItems}
          getRowKey={(item) => item.productId}
          getRowClassName={(item) => ((drafts[item.productId] ?? "").trim() !== "" ? "bg-primary/[0.04]" : undefined)}
          isLoading={isLoading}
          emptyMessage={appliedSearch ? `Ningún producto coincide con "${appliedSearch}".` : "Sin productos en el catálogo."}
          itemLabel={{ singular: "producto", plural: "productos" }}
          defaultPageSize={50}
          filtersTourId="inv-search"
          onFilteredRowsChange={onFilteredItemsChange}
        />
      )}

      <ConfirmSaveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        storeName={storeName}
        entries={dirtyEntries}
        zeroFillCount={zeroFillEntries.length}
        countedAt={countedAt}
        upsert={upsert}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
