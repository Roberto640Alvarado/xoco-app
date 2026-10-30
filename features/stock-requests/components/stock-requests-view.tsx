"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { parseAsInteger, useQueryState } from "nuqs";
import { ArrowDownLeft, ArrowUpRight, PackagePlus, Truck } from "lucide-react";
import { cn } from "cn";
import { DateRangeFilter, type DateRangeValue } from "@/components/filters/date-range-filter";
import { Button } from "@/components/ui/button";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/design-system/components/section-card";
import { todayIsoDate } from "@/lib/format";
import { InfoHint } from "@/features/inventory-guide/components/info-hint";
import { useAuthStore } from "@/store/auth-store";
import { useStockRequests } from "../hooks/use-stock-requests";
import { isRequester, isSupplier, needsMyAction, STATUS_LABEL, STATUS_ORDER, type Viewer } from "../lib/request-status";
import { NewRequestDialog } from "./new-request-dialog";
import { RequestCard } from "./request-card";
import { RequestDetailDialog } from "./request-detail-dialog";
import { StoreTabs, type StoreTab } from "./store-tabs";
import type { StockRequest, StockRequestStatus } from "../types/stock-request.types";

const ALL = "all";
// Pestañas del Vendedor: lo que su tienda pidió / lo que otras tiendas le piden.
const DIRECTION_MINE = 1;
const DIRECTION_TO_ME = 2;
type StatusFilter = typeof ALL | "attention" | StockRequestStatus;

// Por defecto, lo que va del año: una solicitud abierta no se esconde por antigua.
function defaultRange(): DateRangeValue {
  return { dateFrom: `${new Date().getFullYear()}-01-01`, dateTo: todayIsoDate() };
}

function descriptionFor(role: string | undefined): string {
  switch (role) {
    case "VENDEDOR":
      return "Pide stock a planta o a otra tienda, responde lo que te piden y confirma lo que llega.";
    case "PLANTA":
      return "Responde lo que las tiendas piden y despacha.";
    case "SUPER_ADMIN":
      return "Sigue las de todas las tiendas o pide stock para una.";
    default:
      return "Seguimiento de las solicitudes de todas las tiendas.";
  }
}

// Inventario → Solicitudes. Un tablero de tarjetas con el avance de cada
// solicitud; lo que espera una acción de quien mira va primero y resaltado.
// - Tienda: crea solicitudes y confirma lo recibido.
// - Planta: responde (qué hay, qué no, qué agrega) y despacha.
// - Admin/Finanzas: solo seguimiento (y cancelar).
export function StockRequestsView() {
  const user = useAuthStore((state) => state.user);
  const reduceMotion = useReducedMotion() ?? false;
  const role = user?.role;
  const viewer: Viewer = useMemo(() => ({ role: user?.role, posConfigId: user?.posConfigId }), [user?.role, user?.posConfigId]);
  const isStore = role === "VENDEDOR";
  // El Admin también pide stock, eligiendo la tienda.
  const canCreate = isStore || role === "SUPER_ADMIN";
  const isPlant = role === "PLANTA";
  // Admin/Finanzas filtran con un select; Despacho ve una pestaña por tienda.
  const canFilterStores = !isStore && !isPlant;

  const [range, setRange] = useState<DateRangeValue>(defaultRange);
  const [status, setStatus] = useState<StatusFilter>(ALL);
  // La tienda elegida vive en la URL (?tienda=), así se conserva al recargar.
  const [storeParam, setStoreParam] = useQueryState("tienda", parseAsInteger);
  const storeId = storeParam ?? undefined;
  const setStoreId = (next: number | undefined) => void setStoreParam(next ?? null);
  // Vendedor: lo que su tienda pidió o lo que otras tiendas le piden.
  const [direction, setDirection] = useState<number | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);
  const [selected, setSelected] = useState<StockRequest | null>(null);

  const { data, isLoading, isError, error } = useStockRequests({ dateFrom: range.dateFrom, dateTo: range.dateTo });

  const all = useMemo(() => data ?? [], [data]);
  const stores = useMemo(() => {
    const map = new Map<number, string>();
    for (const request of all) map.set(request.posConfigId, request.storeName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [all]);

  const storeTabs = useMemo<StoreTab[]>(() => {
    const tally = (list: StockRequest[]) => ({
      total: list.length,
      pending: list.filter((request) => needsMyAction(viewer, request)).length,
    });
    return [
      { id: undefined, name: "Todas", ...tally(all) },
      ...stores.map(([id, name]) => ({ id, name, ...tally(all.filter((request) => request.posConfigId === id)) })),
    ];
  }, [all, stores, viewer]);

  const byStore = useMemo(() => {
    if (isStore) {
      if (direction === DIRECTION_MINE) return all.filter((request) => isRequester(viewer, request));
      if (direction === DIRECTION_TO_ME) return all.filter((request) => isSupplier(viewer, request));
      return all;
    }
    return storeId === undefined ? all : all.filter((request) => request.posConfigId === storeId);
  }, [all, storeId, isStore, direction, viewer]);

  const directionTabs = useMemo<StoreTab[]>(() => {
    const tally = (list: StockRequest[]) => ({ total: list.length, pending: list.filter((request) => needsMyAction(viewer, request)).length });
    return [
      { id: undefined, name: "Todas", ...tally(all) },
      { id: DIRECTION_MINE, name: "Lo que pedí", icon: ArrowDownLeft, ...tally(all.filter((request) => isRequester(viewer, request))) },
      { id: DIRECTION_TO_ME, name: "Lo que me piden", icon: ArrowUpRight, ...tally(all.filter((request) => isSupplier(viewer, request))) },
    ];
  }, [all, viewer]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { [ALL]: byStore.length, attention: 0 };
    for (const item of STATUS_ORDER) result[item] = 0;
    for (const request of byStore) {
      result[request.status] += 1;
      if (needsMyAction(viewer, request)) result.attention += 1;
    }
    return result;
  }, [byStore, viewer]);

  const visible = useMemo(() => {
    const filtered = byStore.filter((request) => {
      if (status === ALL) return true;
      if (status === "attention") return needsMyAction(viewer, request);
      return request.status === status;
    });
    // Lo que espera acción primero; luego lo más reciente.
    return [...filtered].sort((a, b) => {
      const diff = Number(needsMyAction(viewer, b)) - Number(needsMyAction(viewer, a));
      return diff !== 0 ? diff : b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [byStore, status, viewer]);

  const chips: { value: StatusFilter; label: string }[] = [
    { value: ALL, label: "Todas" },
    ...(role === "VENDEDOR" || role === "PLANTA" ? [{ value: "attention" as const, label: role === "PLANTA" ? "Por responder" : "Por atender" }] : []),
    ...STATUS_ORDER.map((item) => ({ value: item, label: STATUS_LABEL[item] })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionCard icon={Truck} title="Solicitudes" description={descriptionFor(role)} tourId="req-filters" singleLineControls>
        <DateRangeFilter value={range} onChange={setRange} maxDate={todayIsoDate()} />
        {canFilterStores && (
          <Select
            value={storeId === undefined ? ALL : String(storeId)}
            onValueChange={(next) => setStoreId(next === ALL ? undefined : Number(next))}
          >
            <SelectTrigger aria-label="Filtrar por tienda" className="w-full gap-2 sm:w-[190px]">
              <SelectValue>
                {(raw: string) => (raw === ALL ? "Todas las tiendas" : (stores.find(([id]) => String(id) === raw)?.[1] ?? raw))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las tiendas</SelectItem>
              {stores.map(([id, name]) => (
                <SelectItem key={id} value={String(id)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {canCreate && (
          <Button type="button" data-tour="req-new" onClick={() => setNewOpen(true)} disabled={isStore && user?.posConfigId == null}>
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Nueva solicitud
          </Button>
        )}
      </SectionCard>

      {isPlant && stores.length > 0 && <StoreTabs tabs={storeTabs} value={storeId} onChange={setStoreId} />}
      {isStore && directionTabs[2].total > 0 && <StoreTabs tabs={directionTabs} value={direction} onChange={setDirection} />}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado" data-tour="req-status">
        <InfoHint topic="estados-solicitud" />
        {chips.map((chip) => {
          const active = status === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(chip.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {chip.label}
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-primary-foreground/20" : "bg-muted")}>
                {counts[chip.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {isError ? (
        <ChartErrorState message={error?.message} />
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Truck className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium text-foreground">
            {all.length === 0 ? "Todavía no hay solicitudes." : "Ninguna solicitud coincide con los filtros."}
          </p>
          {all.length === 0 && isStore && (
            <p className="max-w-sm text-sm text-muted-foreground">Crea una con “Nueva solicitud”: eliges los productos por categoría y planta te responde.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-tour="req-board">
          {visible.map((request, index) => (
            <motion.div
              key={request.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
              className="flex"
            >
              <RequestCard request={request} viewer={viewer} onOpen={setSelected} />
            </motion.div>
          ))}
        </div>
      )}

      {canCreate && (
        <NewRequestDialog
          open={newOpen}
          onOpenChange={setNewOpen}
          storeName={isStore ? all[0]?.storeName : undefined}
          chooseStore={!isStore}
          onCreated={() => setStatus(ALL)}
        />
      )}

      <RequestDetailDialog summary={selected} onOpenChange={(next) => !next && setSelected(null)} />
    </div>
  );
}
