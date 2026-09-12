"use client";

import { useMemo, useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { MonthNavigator } from "@/components/filters/month-navigator";
import { StoreSelect } from "@/components/filters/store-select";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useAuthStore } from "@/store/auth-store";
import { useTicketGoalsSummary } from "@/features/ticket-goals/hooks/use-ticket-goals-summary";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  currentMonthRef,
  isSameMonth,
  monthLabel as formatMonthLabel,
  monthName,
  nextMonthOf,
  previousMonthOf,
} from "@/lib/month";
import { averageTicketOf } from "../types/ticket-diario.types";
import { useDailyTicket } from "../hooks/use-daily-ticket";
import { useDailyTicketByStore } from "../hooks/use-daily-ticket-by-store";
import { DailyTicketComparisonChart } from "./daily-ticket-comparison-chart";
import { DailyTicketTable } from "./daily-ticket-table";
import { StoreDailyTicketChart } from "./store-daily-ticket-chart";

// El ticket promedio no se puede sumar entre tiendas (a diferencia de
// visitas/venta) — mismo criterio que AverageTicketTable
// (features/ticket-goals/): la fila/tarjeta "todas las tiendas" es un
// PROMEDIO simple, no una suma.
function averageOrNull(values: Array<number | null>): number | null {
  if (values.length === 0 || values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0) / values.length;
}

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
  const isVendedor = useAuthStore((state) => state.user?.role === "VENDEDOR");

  const ticket = useDailyTicket(anchor, posConfigId);
  const byStore = useDailyTicketByStore(anchor);

  // Meta de ticket promedio del mes ancla (mismo dato que alimenta
  // "Ticket Promedio" — ver features/ticket-goals) — filtrada a la tienda
  // seleccionada, o promediada entre todas si el filtro está en "Todas
  // las tiendas". Mismo criterio que el bloque de metas que ya tenía
  // Tráfico Diario/Venta Diaria, para no tener que saltar a otra página a
  // ver el avance del mes mientras se revisa el ticket día a día.
  const ticketGoals = useTicketGoalsSummary(anchor.year, anchor.month);
  const monthGoal = useMemo(() => {
    const goalItems = ticketGoals.data ?? [];
    if (posConfigId) {
      const item = goalItems.find((g) => g.posConfigId === posConfigId);
      if (!item) return null;
      return {
        actualAverageTicket: item.actualAverageTicket,
        targetAverageTicket: item.targetAverageTicket,
        reachPercent: item.reachPercent,
      };
    }
    if (goalItems.length === 0) return null;
    return {
      actualAverageTicket: averageOrNull(goalItems.map((item) => item.actualAverageTicket)) ?? 0,
      targetAverageTicket: averageOrNull(goalItems.map((item) => item.targetAverageTicket)),
      reachPercent: averageOrNull(goalItems.map((item) => item.reachPercent)),
    };
  }, [ticketGoals.data, posConfigId]);

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
      <FilterToolbar description="Ticket promedio por día — mes seleccionado y los dos meses anteriores.">
        <MonthNavigator
          label={formatMonthLabel(anchor)}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          nextDisabled={isNextDisabled}
        />
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={setPosConfigId}
          lockedToSingleStore={isVendedor}
        />
        <ExportExcelButton
          filename="ticket-diario"
          disabled={ticket.anchor.isLoading}
          sheets={() => [
            {
              name: ticket.anchor.label,
              rows: (ticket.anchor.data ?? []).map((p) => ({ Fecha: p.date, "Ticket promedio": averageTicketOf(p) })),
            },
            {
              name: ticket.prev1.label,
              rows: (ticket.prev1.data ?? []).map((p) => ({ Fecha: p.date, "Ticket promedio": averageTicketOf(p) })),
            },
            {
              name: ticket.prev2.label,
              rows: (ticket.prev2.data ?? []).map((p) => ({ Fecha: p.date, "Ticket promedio": averageTicketOf(p) })),
            },
          ]}
        />
      </FilterToolbar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Ticket promedio a la fecha (mes ancla)"
          value={formatCurrency(monthGoal?.actualAverageTicket ?? 0)}
          isLoading={ticketGoals.isLoading}
        />
        <StatTile
          label="Meta del mes"
          value={monthGoal?.targetAverageTicket != null ? formatCurrency(monthGoal.targetAverageTicket) : "—"}
          isLoading={ticketGoals.isLoading}
        />
        <StatTile
          label="Alcance de meta"
          value={formatPercent(monthGoal?.reachPercent ?? null)}
          isLoading={ticketGoals.isLoading}
        />
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
