"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  currentMonthRef,
  monthLabel as formatMonthLabel,
  monthName,
  nextMonthOf,
  previousMonthOf,
  isSameMonth,
} from "@/lib/month";
import { useGoalsSummary } from "@/features/goals/hooks/use-goals-summary";
import { useSalesGoalsSummary } from "@/features/sales-goals/hooks/use-sales-goals-summary";
import { useTicketGoalsSummary } from "@/features/ticket-goals/hooks/use-ticket-goals-summary";
import { formatCurrency, formatInteger } from "@/lib/format";
import { averageOrNull, buildSection, sumOrNull } from "../lib/aggregate";
import { MonthCloseSectionTable } from "./month-close-section";

// Vista principal de "Cierre del mes": para el mes seleccionado ("ancla"
// = Cierre), muestra 3 secciones apiladas (Tráfico / Venta / Ticket
// Promedio) comparando el total del mes anterior contra el cierre del
// mes seleccionado, junto con la meta y el alcance ya configurados en
// los 3 módulos de metas (Tráfico de tiendas / Venta Mensual / Ticket
// Promedio). Es un módulo de solo lectura: no agrega ni un modelo ni un
// endpoint nuevo en xoco-api — reutiliza directamente los hooks de esos
// 3 módulos (a diferencia de la familia Tráfico Diario/Venta
// Diaria/Ticket Detallado, que deliberadamente duplica su lógica de
// fetch, este módulo depende A PROPÓSITO de esos 3 para no desalinearse
// nunca de "las metas respectivas" que el usuario pidió reflejar aquí).
export function MonthCloseView() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentMonthRef(now), [now]);
  const [anchor, setAnchor] = useState(currentMonth);
  const prev = useMemo(() => previousMonthOf(anchor), [anchor]);

  function goToPreviousMonth() {
    setAnchor((current) => previousMonthOf(current));
  }

  const isNextMonthDisabled = isSameMonth(anchor, currentMonth);

  function goToNextMonth() {
    if (isNextMonthDisabled) return;
    setAnchor((current) => nextMonthOf(current));
  }

  // Tráfico: /goals/summary del mes ancla ya trae "previousMonthActualOrders"
  // por tienda, no hace falta una segunda llamada.
  const goalsAnchor = useGoalsSummary(anchor.year, anchor.month);

  // Venta y Ticket no traen el mes anterior en la respuesta (a diferencia
  // de Tráfico) — se pide dos veces, una por cada mes.
  const salesAnchor = useSalesGoalsSummary(anchor.year, anchor.month);
  const salesPrev = useSalesGoalsSummary(prev.year, prev.month);
  const ticketAnchor = useTicketGoalsSummary(anchor.year, anchor.month);
  const ticketPrev = useTicketGoalsSummary(prev.year, prev.month);

  const trafficSection = useMemo(() => {
    const items = goalsAnchor.data ?? [];
    const previousTotal = items.length > 0 ? items.reduce((sum, item) => sum + item.previousMonthActualOrders, 0) : null;
    const closeTotal = items.length > 0 ? items.reduce((sum, item) => sum + item.actualOrders, 0) : null;
    const target = sumOrNull(items.map((item) => item.targetOrders));
    return buildSection(previousTotal, closeTotal, target);
  }, [goalsAnchor.data]);

  const salesSection = useMemo(() => {
    const anchorItems = salesAnchor.data ?? [];
    const prevItems = salesPrev.data ?? [];
    const previousTotal = prevItems.length > 0 ? prevItems.reduce((sum, item) => sum + item.actualRevenue, 0) : null;
    const closeTotal = anchorItems.length > 0 ? anchorItems.reduce((sum, item) => sum + item.actualRevenue, 0) : null;
    const target = sumOrNull(anchorItems.map((item) => item.targetRevenue));
    return buildSection(previousTotal, closeTotal, target);
  }, [salesAnchor.data, salesPrev.data]);

  const ticketSection = useMemo(() => {
    const anchorItems = ticketAnchor.data ?? [];
    const prevItems = ticketPrev.data ?? [];
    // Promedio simple entre tiendas (igual que la fila "Promedio" de
    // Ticket Promedio) — no una suma, un ticket promedio no se suma.
    const previousTotal = averageOrNull(prevItems.map((item) => item.actualAverageTicket));
    const closeTotal = averageOrNull(anchorItems.map((item) => item.actualAverageTicket));
    const target = averageOrNull(anchorItems.map((item) => item.targetAverageTicket));
    return buildSection(previousTotal, closeTotal, target);
  }, [ticketAnchor.data, ticketPrev.data]);

  const previousMonthLabel = monthName(prev);
  const closeMonthLabel = `Cierre ${monthName(anchor)}`;
  const growthColumnLabel = `Crecimiento o decrecimiento vs ${previousMonthLabel}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Cierre del mes seleccionado contra el mes anterior, con la meta y el alcance de Tráfico de tiendas, Venta
          Mensual y Ticket Promedio.
        </p>
        <div className="flex items-center gap-1 self-start sm:self-auto">
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
            disabled={isNextMonthDisabled}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <MonthCloseSectionTable
        title="Tráfico"
        previousMonthLabel={previousMonthLabel}
        closeMonthLabel={closeMonthLabel}
        growthColumnLabel={growthColumnLabel}
        section={trafficSection}
        isLoading={goalsAnchor.isLoading}
        isError={goalsAnchor.isError}
        errorMessage={goalsAnchor.error?.message}
        formatValue={formatInteger}
      />

      <MonthCloseSectionTable
        title="Venta"
        previousMonthLabel={previousMonthLabel}
        closeMonthLabel={closeMonthLabel}
        growthColumnLabel={growthColumnLabel}
        section={salesSection}
        isLoading={salesAnchor.isLoading || salesPrev.isLoading}
        isError={salesAnchor.isError || salesPrev.isError}
        errorMessage={salesAnchor.error?.message ?? salesPrev.error?.message}
        formatValue={formatCurrency}
      />

      <MonthCloseSectionTable
        title="Ticket Promedio"
        previousMonthLabel={previousMonthLabel}
        closeMonthLabel={closeMonthLabel}
        growthColumnLabel={growthColumnLabel}
        section={ticketSection}
        isLoading={ticketAnchor.isLoading || ticketPrev.isLoading}
        isError={ticketAnchor.isError || ticketPrev.isError}
        errorMessage={ticketAnchor.error?.message ?? ticketPrev.error?.message}
        formatValue={formatCurrency}
      />
    </div>
  );
}
