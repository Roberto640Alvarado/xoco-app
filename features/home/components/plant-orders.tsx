"use client";

import { useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, ClipboardList, Hourglass, RefreshCw, Truck, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatInteger, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/client";
import { usePlantSummary } from "../hooks/use-today-sales";
import type { PlantSummaryStore } from "../types/today-sales.types";

const ALL = "todas";
const BAR = "var(--color-chart-1)";

function Kpi({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-semibold tabular-nums text-foreground">{formatInteger(value)}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function DayTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{formatShortDate(label)}</p>
      <p className="text-muted-foreground">
        {formatInteger(payload[0]?.value ?? 0)} pedidos
      </p>
    </div>
  );
}

function StoreCard({ store, index, selected, onSelect }: { store: PlantSummaryStore; index: number; selected: boolean; onSelect: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-colors",
        selected ? "border-[#7b4a30] ring-1 ring-[#7b4a30]/40" : "border-border hover:border-foreground/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-foreground">{store.storeName}</p>
        {store.today > 0 && (
          <span className="shrink-0 rounded-full bg-[#b27a52]/15 px-2 py-0.5 text-xs font-semibold text-[#7b4a30] dark:text-[#d0996c]">{store.today} hoy</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className={cn("rounded-xl px-2 py-2", store.pending > 0 ? "bg-amber-500/12" : "bg-muted/50")}>
          <span className="block text-xl font-semibold tabular-nums text-foreground">{store.pending}</span>
          <span className="block text-[11px] text-muted-foreground">Por preparar</span>
        </div>
        <div className={cn("rounded-xl px-2 py-2", store.onTheWay > 0 ? "bg-violet-500/12" : "bg-muted/50")}>
          <span className="block text-xl font-semibold tabular-nums text-foreground">{store.onTheWay}</span>
          <span className="block text-[11px] text-muted-foreground">En camino</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {formatInteger(store.recent)} pedidos en 14 días · {formatInteger(Math.round(store.units))} unidades
      </p>
    </motion.button>
  );
}

/** Inicio de Planta: los pedidos de las tiendas en números y en gráfica (todas o una). */
export function PlantOrders() {
  const { data, isLoading, isError, error, refetch, isFetching } = usePlantSummary(true);
  const [store, setStore] = useState<string>(ALL);
  const selected = data?.stores.find((item) => String(item.posConfigId) === store);
  const chartData = (data?.byDay ?? []).map((day) => ({ date: day.date, value: selected ? (day.byStore[selected.posConfigId] ?? 0) : day.total }));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pedidos de las tiendas</h2>
          <p className="text-sm text-muted-foreground">Lo que piden a planta: hoy, por preparar y en camino.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} aria-hidden="true" />
            Se actualiza cada minuto
          </button>
          <Link href="/dashboard/inventario/solicitudes" className="inline-flex items-center gap-1 text-xs font-medium text-[#7b4a30] hover:underline dark:text-[#d0996c]">
            Ver solicitudes
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {isError ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as unknown as ApiError)?.message ?? "No se pudieron cargar los pedidos."}
        </p>
      ) : isLoading || !data ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-20 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <Skeleton className="mb-3 h-5 w-56" />
            <ChartSkeleton height={224} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={ClipboardList} label="Pedidos de hoy" value={data.totals.today} tone="bg-[#b27a52]/15 text-[#7b4a30] dark:text-[#d0996c]" />
            <Kpi icon={Hourglass} label="Por preparar o responder" value={data.totals.pending} tone="bg-amber-500/15 text-amber-700 dark:text-amber-300" />
            <Kpi icon={Truck} label="En camino" value={data.totals.onTheWay} tone="bg-violet-500/15 text-violet-700 dark:text-violet-300" />
            <Kpi icon={CheckCircle2} label="Recibidos hoy" value={data.totals.receivedToday} tone="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.stores.map((item, index) => (
              <StoreCard
                key={item.posConfigId}
                store={item}
                index={index}
                selected={selected?.posConfigId === item.posConfigId}
                onSelect={() => setStore(selected?.posConfigId === item.posConfigId ? ALL : String(item.posConfigId))}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Pedidos por día · últimos 14 días</h3>
              <Select value={store} onValueChange={(next) => setStore(String(next ?? ALL))}>
                <SelectTrigger className="h-8 min-w-44" aria-label="Tienda de la gráfica">
                  <SelectValue>{(raw: string) => (!raw || raw === ALL ? "Todas las tiendas" : (data.stores.find((item) => String(item.posConfigId) === raw)?.storeName ?? "Tienda"))}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas las tiendas</SelectItem>
                  {data.stores.map((item) => (
                    <SelectItem key={item.posConfigId} value={String(item.posConfigId)}>
                      {item.storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 0, right: 4, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip content={<DayTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                  <Bar dataKey="value" name="Pedidos" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
