"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStores } from "@/features/sales/hooks/use-stores";
import {
  currentMonthRef,
  isSameMonth,
  monthLabel as formatMonthLabel,
  monthName,
  nextMonthOf,
  previousMonthOf,
} from "@/lib/month";
import { useDailyTicket } from "../hooks/use-daily-ticket";
import { useDailyTicketByStore } from "../hooks/use-daily-ticket-by-store";
import { DailyTicketComparisonChart } from "./daily-ticket-comparison-chart";
import { DailyTicketTable } from "./daily-ticket-table";
import { StoreDailyTicketChart } from "./store-daily-ticket-chart";

const ALL_STORES = "all";

// Módulo "Ticket Detallado": mismo diseño que Tráfico Diario/Venta Diaria
// (mismo filtro de mes ancla + tienda, mismas 3 tablas, misma gráfica de
// comparación entre los dos meses previos y misma gráfica de
// comportamiento por tienda), pero mostrando el ticket promedio
// (venta/órdenes) de cada día en vez de la cantidad de órdenes o la venta
// sola.
export function DailyTicketView() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentMonthRef(now), [now]);
  const [anchor, setAnchor] = useState(currentMonth);
  const [posConfigId, setPosConfigId] = useState<number | undefined>(undefined);

  const { data: stores, isLoading: storesLoading } = useStores();
  const storeValue = posConfigId ? String(posConfigId) : ALL_STORES;

  function storeLabel(value: string): string {
    if (value === ALL_STORES) return "Todas las tiendas";
    const store = stores?.find((s) => String(s.id) === value);
    return store?.name ?? value;
  }

  const ticket = useDailyTicket(anchor, posConfigId);
  const byStore = useDailyTicketByStore(anchor);

  const isNextDisabled = isSameMonth(anchor, currentMonth);

  function goToPreviousMonth() {
    setAnchor((current) => previousMonthOf(current));
  }

  function goToNextMonth() {
    if (isNextDisabled) return;
    setAnchor((current) => nextMonthOf(current));
  }

  const comparisonTitle = `Comportamiento del ticket promedio ${monthName(ticket.prev2.monthRef)} vrs ${monthName(ticket.prev1.monthRef)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Ticket promedio por día — mes seleccionado y los dos meses anteriores.
        </p>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon-sm" onClick={goToPreviousMonth} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="w-32 text-center text-sm font-medium capitalize text-foreground">
              {formatMonthLabel(anchor)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={goToNextMonth}
              disabled={isNextDisabled}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <Select
            value={storeValue}
            onValueChange={(value) => setPosConfigId(value === ALL_STORES ? undefined : Number(value))}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={storesLoading ? "Cargando..." : "Todas las tiendas"}>
                {(value: string) => (storesLoading ? "Cargando..." : storeLabel(value))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STORES}>Todas las tiendas</SelectItem>
              {stores?.map((store) => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DailyTicketTable
          title={ticket.anchor.label}
          data={ticket.anchor.data}
          isLoading={ticket.anchor.isLoading}
          isError={ticket.anchor.isError}
          errorMessage={ticket.anchor.errorMessage}
        />
        <DailyTicketTable
          title={ticket.prev1.label}
          data={ticket.prev1.data}
          isLoading={ticket.prev1.isLoading}
          isError={ticket.prev1.isError}
          errorMessage={ticket.prev1.errorMessage}
        />
        <DailyTicketTable
          title={ticket.prev2.label}
          data={ticket.prev2.data}
          isLoading={ticket.prev2.isLoading}
          isError={ticket.prev2.isError}
          errorMessage={ticket.prev2.errorMessage}
        />
      </div>

      <DailyTicketComparisonChart
        title={comparisonTitle}
        olderLabel={monthName(ticket.prev2.monthRef)}
        recentLabel={monthName(ticket.prev1.monthRef)}
        olderPoints={ticket.prev2.data}
        recentPoints={ticket.prev1.data}
        isLoading={ticket.prev2.isLoading || ticket.prev1.isLoading}
      />

      <StoreDailyTicketChart series={byStore.data} isLoading={byStore.isLoading} monthLabel={ticket.anchor.label} />
    </div>
  );
}
