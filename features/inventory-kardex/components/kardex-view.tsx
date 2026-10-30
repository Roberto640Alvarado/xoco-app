"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, BookOpenCheck, Boxes, ChevronsDownUp, FileDown, Loader2, Search } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter, type DateRangeValue } from "@/components/filters/date-range-filter";
import { StoreSelect } from "@/components/filters/store-select";
import { SectionCard } from "@/design-system/components/section-card";
import { NoticeCard } from "@/design-system/components/notice-card";
import { formatInteger, formatKg, todayIsoDate } from "@/lib/format";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { useAuthStore } from "@/store/auth-store";
import { useInventoryKardex } from "../hooks/use-inventory-kardex";
import { kardexSheets } from "../lib/kardex-excel";
import { downloadKardexPdf } from "../lib/kardex-pdf";
import { byCategory, formatPeriod, slug } from "../lib/kardex-format";
import { KARDEX_GRID, KardexProductRow } from "./kardex-product-row";
import type { KardexProduct } from "../types/inventory-kardex.types";

const ALL = "__all__";
type MovementFilter = "moved" | "all";

// Del 1 del mes a hoy: el período típico de un cierre.
function monthToDate(): DateRangeValue {
  const today = todayIsoDate();
  return { dateFrom: `${today.slice(0, 8)}01`, dateTo: today };
}

// Piezas y kg por separado (no se suman unidades distintas).
function sumByUnit(products: KardexProduct[], pick: (product: KardexProduct) => number): string {
  const pieces = products.filter((p) => p.unit === "unidad").reduce((sum, p) => sum + pick(p), 0);
  const kilos = products.filter((p) => p.unit === "kg").reduce((sum, p) => sum + pick(p), 0);
  return kilos ? `${formatInteger(pieces)} u · ${formatKg(kilos)}` : `${formatInteger(pieces)} u`;
}

// Cómo se lee cada columna, en palabras simples.
const LEGEND = [
  { label: "Inicial", text: "lo que había al empezar", dot: "bg-muted-foreground" },
  { label: "Entró", text: "envíos recibidos", dot: "bg-emerald-500" },
  { label: "Salió", text: "ventas, mermas, regalías y traslados", dot: "bg-destructive" },
  { label: "Ajuste", text: "diferencia al contar", dot: "bg-sky-500" },
  { label: "Final", text: "lo que debería haber", dot: "bg-foreground" },
];

// Inventario → Kardex: por tienda y período, cuánto había, qué entró, qué
// salió y cuánto queda de cada producto, agrupado por categoría en una sola
// tabla. Tocar un producto abre su kardex línea por línea. Se descarga en
// PDF (para imprimir y firmar) o Excel. El Vendedor solo ve el de su tienda;
// Admin y Finanzas eligen la tienda.
export function KardexView() {
  const email = useAuthStore((state) => state.user?.email);
  const reduce = useReducedMotion() ?? false;
  const { data: stores, isLoading: storesLoading } = useStores();
  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(defaultPosConfigId);
  const [range, setRange] = useState<DateRangeValue>(monthToDate);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [movement, setMovement] = useState<MovementFilter>("moved");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [pdfLoading, setPdfLoading] = useState(false);

  if (posConfigId === undefined && !isVendedor && stores && stores.length > 0) {
    setPosConfigId(stores[0].id);
  }

  const kardex = useInventoryKardex(posConfigId === undefined ? undefined : { posConfigId, ...range });
  const products = useMemo(() => kardex.data?.products ?? [], [kardex.data]);
  const categories = useMemo(() => byCategory(products).map((block) => block.category), [products]);
  const moved = useMemo(() => products.filter((product) => product.rows.length > 0), [products]);
  const withoutCount = products.filter((product) => product.closingBalance === null).length;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        (movement === "all" || product.rows.length > 0) &&
        (category === ALL || product.categoryName === category) &&
        (!term || product.productName.toLowerCase().includes(term)),
    );
  }, [products, movement, category, search]);
  const blocks = useMemo(() => byCategory(visible), [visible]);

  function toggle(productId: number) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  async function handlePdf() {
    if (!kardex.data) return;
    setPdfLoading(true);
    try {
      await downloadKardexPdf(kardex.data, email);
    } finally {
      setPdfLoading(false);
    }
  }

  const ready = kardex.data != null && products.length > 0;
  const storeName = kardex.data?.storeName ?? stores?.find((store) => store.id === posConfigId)?.name;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Encabezado: qué es y las descargas */}
      <SectionCard
        icon={BookOpenCheck}
        title={storeName ? `Kardex · ${storeName}` : "Kardex"}
        description={
          kardex.data
            ? formatPeriod(kardex.data.dateFrom, kardex.data.dateTo)
            : isVendedor
              ? "Cuánto había, qué entró, qué salió y cuánto queda en tu tienda."
              : "Cuánto había, qué entró, qué salió y cuánto queda en cada tienda."
        }
        tourId="kardex-download"
      >
        <Button type="button" onClick={handlePdf} disabled={!ready || pdfLoading}>
          {pdfLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileDown className="size-4" aria-hidden="true" />}
          Descargar PDF
        </Button>
        <ExportExcelButton
          size="default"
          label="Excel"
          filename={`kardex-${slug(storeName ?? "tienda")}-${range.dateFrom}-a-${range.dateTo}`}
          disabled={!ready}
          sheets={() => (kardex.data ? kardexSheets(kardex.data) : [])}
        />
      </SectionCard>

      {/* Filtros: una sola card que se acomoda en varias líneas */}
      <SectionCard controlsOnly tourId="kardex-filters">
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={setPosConfigId}
          hideAllStoresOption
          lockedToSingleStore={isVendedor}
          className="sm:w-56"
        />
        <DateRangeFilter value={range} onChange={setRange} maxDate={todayIsoDate()} />
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar un producto..." aria-label="Buscar producto" className="h-9 pl-9" />
        </div>
        <Select value={category} onValueChange={(next) => setCategory(next ?? ALL)}>
          <SelectTrigger aria-label="Categoría" className="w-full sm:w-56">
            <SelectValue>{(raw: string) => (raw === ALL ? "Todas las categorías" : raw)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border border-border bg-background p-0.5" role="group" aria-label="Qué productos mostrar">
          {(
            [
              { value: "moved", label: `Con movimientos${moved.length ? ` (${moved.length})` : ""}` },
              { value: "all", label: `Todos${products.length ? ` (${products.length})` : ""}` },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={movement === option.value}
              onClick={() => setMovement(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                movement === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </SectionCard>

      {posConfigId === undefined ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          {storesLoading ? "Cargando tiendas..." : "Selecciona una tienda para generar su kardex."}
        </div>
      ) : kardex.isError ? (
        <ChartErrorState message={kardex.error?.message} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="kardex-totals">
            <StatTile label="con movimiento" value={formatInteger(moved.length)} icon={Boxes} isLoading={kardex.isLoading} />
            <StatTile label="entró" value={sumByUnit(products, (p) => p.totalIn)} icon={ArrowDownToLine} isLoading={kardex.isLoading} />
            <StatTile label="salió" value={sumByUnit(products, (p) => p.totalOut)} icon={ArrowUpFromLine} isLoading={kardex.isLoading} />
            <StatTile label="sin conteo físico" value={formatInteger(withoutCount)} icon={AlertTriangle} isLoading={kardex.isLoading} />
          </div>

          {!kardex.isLoading && withoutCount > 0 && (
            <NoticeCard
              tone="warning"
              icon={AlertTriangle}
              title={`${formatInteger(withoutCount)} producto${withoutCount === 1 ? "" : "s"} sin conteo físico`}
              description={
                isVendedor
                  ? "Su saldo sale como “—” porque nadie los ha contado todavía. Cuando Finanzas o Admin los cuenten en Conteo, el kardex mostrará cuánto queda."
                  : "Su saldo sale como “—” porque no tienen un conteo de partida. Cuéntalos en Conteo y el kardex calculará cuánto queda."
              }
              action={
                isVendedor ? undefined : (
                  <Link href={`/dashboard/inventario?tienda=${posConfigId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Ir a Conteo
                  </Link>
                )
              }
            />
          )}

          {/* Leyenda: cómo leer las columnas */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Cómo leer el kardex">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", item.dot)} aria-hidden="true" />
                <span className="font-semibold text-foreground">{item.label}</span> {item.text}
              </li>
            ))}
          </ul>

          {kardex.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <BookOpenCheck className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium text-foreground">No hay movimientos ni conteos en este período.</p>
              <p className="max-w-sm text-sm text-muted-foreground">Prueba con otro rango de fechas.</p>
            </div>
          ) : blocks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Ningún producto coincide con los filtros.
            </p>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs" data-tour="kardex-list" aria-label="Kardex por producto">
              <div className={cn("hidden border-b border-border bg-muted/60 px-4 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase", KARDEX_GRID)}>
                <span>Producto</span>
                <span className="text-right">Inicial</span>
                <span className="text-right">Entró</span>
                <span className="text-right">Salió</span>
                <span className="text-right">Ajuste</span>
                <span className="text-right">Final</span>
                <span className="flex justify-end">
                  {openIds.size > 0 && (
                    <button type="button" onClick={() => setOpenIds(new Set())} aria-label="Cerrar todos" title="Cerrar todos" className="rounded p-0.5 hover:bg-muted">
                      <ChevronsDownUp className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </span>
              </div>
              {blocks.map((block) => (
                <div key={block.category}>
                  <h3 className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2 text-xs font-bold tracking-wider text-foreground uppercase">
                    {block.category}
                    <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">{block.products.length}</span>
                  </h3>
                  {block.products.map((product, index) => (
                    <motion.div
                      key={product.productId}
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.02 }}
                    >
                      <KardexProductRow
                        product={product}
                        open={openIds.has(product.productId)}
                        onToggle={() => toggle(product.productId)}
                        showNoCountBadge={withoutCount < products.length}
                      />
                    </motion.div>
                  ))}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
