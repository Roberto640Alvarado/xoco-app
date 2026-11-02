"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, Flame, Receipt, RefreshCw, ShoppingBag, TrendingDown, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatCurrencyCompact, formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/client";
import { useTodaySales } from "../hooks/use-today-sales";
import type { TodayHour, TodayStore, TodaySummary } from "../types/today-sales.types";

const TODAY = "var(--color-chart-1)";
const ALL = "todas";
const LAST_WEEK = "var(--color-chart-2)";

function hourLabel(hour: number): string {
  if (hour === 0) return "12 a.m.";
  if (hour === 12) return "12 m.";
  return hour < 12 ? `${hour} a.m.` : `${hour - 12} p.m.`;
}

/** Horas a mostrar: de la primera con ventas (o 8 a.m.) a la última / la hora actual (o 8 p.m.). */
function visibleHours(byHour: TodayHour[], currentHour: number): TodayHour[] {
  const active = byHour.filter((slot) => slot.total > 0 || slot.lastWeekTotal > 0).map((slot) => slot.hour);
  const from = Math.min(8, ...active);
  const to = Math.max(20, currentHour, ...active);
  return byHour.filter((slot) => slot.hour >= from && slot.hour <= to);
}

function Change({ value, compact = false }: { value: number | null; compact?: boolean }) {
  if (value === null) return <span className="text-xs text-muted-foreground">{compact ? "—" : "Sin datos de la semana pasada"}</span>;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        up ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/12 text-rose-700 dark:text-rose-300",
      )}
      title="Contra el mismo día de la semana pasada, hasta esta misma hora"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

function Kpi({ icon: Icon, label, value, children }: { icon: LucideIcon; label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border bg-card p-4">
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </span>
      <span className="truncate text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      {children}
    </div>
  );
}

function HourTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey?: string; value?: number; payload?: TodayHour }[]; label?: number }) {
  if (!active || !payload?.length || label === undefined) return null;
  const slot = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">
        {hourLabel(label)} – {hourLabel((label + 1) % 24)}
      </p>
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <span className="h-2 w-2 rounded-sm" style={{ background: TODAY }} />
        Hoy: <span className="font-medium text-foreground">{formatCurrency(slot?.total ?? 0)}</span> · {slot?.orders ?? 0} órdenes
      </p>
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <span className="h-0.5 w-3" style={{ background: LAST_WEEK }} />
        Semana pasada: <span className="font-medium text-foreground">{formatCurrency(slot?.lastWeekTotal ?? 0)}</span>
      </p>
    </div>
  );
}

function HourlyChart({ byHour, currentHour, height = "h-56" }: { byHour: TodayHour[]; currentHour: number; height?: string }) {
  const data = visibleHours(byHour, currentHour);
  return (
    <div className={cn("w-full", height)}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 0, right: 4, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="hour" tickFormatter={hourLabel} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tickFormatter={(value: number) => formatCurrencyCompact(value)} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<HourTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
          <Bar dataKey="total" name="Hoy" fill={TODAY} radius={[4, 4, 0, 0]} maxBarSize={34} />
          <Line dataKey="lastWeekTotal" name="Semana pasada" type="monotone" stroke={LAST_WEEK} strokeWidth={2} strokeDasharray="5 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function Legend() {
  return (
    <span className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TODAY }} />
        Hoy
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: LAST_WEEK }} />
        Semana pasada
      </span>
    </span>
  );
}

function Header({ asOf, lastWeekDate, refetch, fetching }: { asOf?: string; lastWeekDate?: string; refetch: () => void; fetching: boolean }) {
  const weekday = lastWeekDate
    ? new Intl.DateTimeFormat("es-SV", { weekday: "long", timeZone: "UTC" }).format(new Date(`${lastWeekDate}T12:00:00Z`))
    : "";
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Ventas de hoy
        </h2>
        <p className="text-sm text-muted-foreground">
          Venta de caja hasta las {asOf ?? "…"}, contra el {weekday} pasado a la misma hora.
        </p>
      </div>
      <button
        type="button"
        onClick={refetch}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", fetching && "animate-spin")} aria-hidden="true" />
        Se actualiza cada 2 min
      </button>
    </div>
  );
}

function Kpis({ summary }: { summary: TodaySummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi icon={Wallet} label="Vendido hoy" value={formatCurrency(summary.total)}>
        <Change value={summary.changePct} />
      </Kpi>
      <Kpi icon={ShoppingBag} label="Órdenes" value={formatInteger(summary.orders)}>
        <span className="text-xs text-muted-foreground">Semana pasada a esta hora: {formatCurrency(summary.lastWeekToNow)}</span>
      </Kpi>
      <Kpi icon={Receipt} label="Ticket promedio" value={formatCurrency(summary.averageTicket)} />
      <Kpi icon={Flame} label="Hora más fuerte" value={summary.bestHour === null ? "—" : `${hourLabel(summary.bestHour)}`}>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Última venta: {summary.lastOrderTime ?? "sin ventas aún"}
        </span>
      </Kpi>
    </div>
  );
}

function MiniBars({ byHour, currentHour }: { byHour: TodayHour[]; currentHour: number }) {
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={visibleHours(byHour, currentHour)} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
          <Bar dataKey="total" fill={TODAY} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StoreCard({
  store,
  rank,
  currentHour,
  maxTotal,
  selected,
  onSelect,
}: {
  store: TodayStore;
  rank: number;
  currentHour: number;
  maxTotal: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={selected ? "Ver todas las tiendas en la gráfica" : `Ver ${store.storeName} en la gráfica por hora`}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-colors",
        selected ? "border-[#7b4a30] ring-1 ring-[#7b4a30]/40" : "border-border hover:border-foreground/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{store.storeName}</p>
          <p className="text-xs text-muted-foreground">
            {formatInteger(store.orders)} órdenes · ticket {formatCurrency(store.averageTicket)}
          </p>
        </div>
        <Change value={store.changePct} compact />
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(store.total)}</span>
        <span className="text-xs text-muted-foreground">{store.lastOrderTime ? `Última: ${store.lastOrderTime}` : "Sin ventas aún"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${maxTotal ? (store.total / maxTotal) * 100 : 0}%`, background: TODAY }} />
      </div>
      <MiniBars byHour={store.byHour} currentHour={currentHour} />
    </motion.button>
  );
}

function ErrorBox({ error }: { error: unknown }) {
  return (
    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {(error as ApiError)?.message ?? "No se pudieron cargar las ventas de hoy."}
    </p>
  );
}

function LoadingBlock({ stores = false }: { stores?: boolean }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      {stores && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-border bg-card p-4">
        <Skeleton className="mb-3 h-5 w-40" />
        <ChartSkeleton height={224} />
      </div>
    </div>
  );
}

/** Admin y Finanzas: el día de todas las tiendas. */
export function TodaySalesAllStores() {
  const { data, isLoading, isError, error, refetch, isFetching } = useTodaySales(true);
  const currentHour = data ? Number(data.asOf.slice(0, 2)) : 12;
  const maxTotal = Math.max(...(data?.stores.map((store) => store.total) ?? [0]), 0);
  // Gráfica por hora: todas las tiendas o una (también al tocar su tarjeta).
  const [chartStore, setChartStore] = useState<string>(ALL);
  const selectedStore = data?.stores.find((store) => String(store.posConfigId) === chartStore);

  return (
    <section className="flex flex-col gap-3">
      <Header asOf={data?.asOf} lastWeekDate={data?.lastWeekDate} refetch={() => void refetch()} fetching={isFetching} />
      {isError ? (
        <ErrorBox error={error} />
      ) : isLoading || !data ? (
        <LoadingBlock stores />
      ) : (
        <>
          <Kpis summary={data.totals} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.stores.map((store, index) => (
              <StoreCard
                key={store.posConfigId}
                store={store}
                rank={index}
                currentHour={currentHour}
                maxTotal={maxTotal}
                selected={selectedStore?.posConfigId === store.posConfigId}
                onSelect={() => setChartStore(selectedStore?.posConfigId === store.posConfigId ? ALL : String(store.posConfigId))}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Por hora</h3>
                <Select value={chartStore} onValueChange={(next) => setChartStore(String(next ?? ALL))}>
                  <SelectTrigger className="h-8 min-w-44" aria-label="Tienda de la gráfica">
                    <SelectValue>
                      {(raw: string) => (!raw || raw === ALL ? "Todas las tiendas" : (data.stores.find((store) => String(store.posConfigId) === raw)?.storeName ?? "Tienda"))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas las tiendas</SelectItem>
                    {data.stores.map((store) => (
                      <SelectItem key={store.posConfigId} value={String(store.posConfigId)}>
                        {store.storeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStore && (
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(selectedStore.total)} · {formatInteger(selectedStore.orders)} órdenes
                  </span>
                )}
              </div>
              <Legend />
            </div>
            <HourlyChart byHour={(selectedStore ?? data.totals).byHour} currentHour={currentHour} />
          </div>
        </>
      )}
    </section>
  );
}

/** Vendedor: su tienda, hora por hora. */
export function TodaySalesMyStore() {
  const { data, isLoading, isError, error, refetch, isFetching } = useTodaySales(true);
  const currentHour = data ? Number(data.asOf.slice(0, 2)) : 12;
  const store = data?.stores[0];

  return (
    <section className="flex flex-col gap-3">
      <Header asOf={data?.asOf} lastWeekDate={data?.lastWeekDate} refetch={() => void refetch()} fetching={isFetching} />
      {isError ? (
        <ErrorBox error={error} />
      ) : isLoading || !data ? (
        <LoadingBlock />
      ) : (
        <>
          <Kpis summary={store ?? data.totals} />
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Ventas por hora{store ? ` · ${store.storeName}` : ""}</h3>
              <Legend />
            </div>
            <HourlyChart byHour={(store ?? data.totals).byHour} currentHour={currentHour} height="h-64" />
          </div>
        </>
      )}
    </section>
  );
}
