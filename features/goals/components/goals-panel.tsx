"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoalsSummary } from "../hooks/use-goals-summary";
import { useUpsertGoal } from "../hooks/use-upsert-goal";
import { formatInteger, formatPercent } from "@/lib/format";
import type { GoalSummaryItem } from "../types/goals.types";

const MONTH_LABELS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

interface GoalRowProps {
  item: GoalSummaryItem;
  isSaving: boolean;
  onSave: (targetOrders: number) => void;
}

function GoalRow({ item, isSaving, onSave }: GoalRowProps) {
  const savedValue = item.targetOrders != null ? String(item.targetOrders) : "";
  const [draft, setDraft] = useState(savedValue);
  const isDirty = draft !== savedValue;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 text-sm font-medium text-foreground">{item.storeName}</td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Sin meta"
            className="w-24"
            aria-label={`Meta de ${item.storeName}`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!isDirty || draft === "" || isSaving}
            onClick={() => onSave(Number(draft))}
            aria-label={`Guardar meta de ${item.storeName}`}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </td>
      <td className="py-3 pr-4 text-sm text-foreground">{formatInteger(item.actualOrders)}</td>
      <td className="py-3 pr-4 text-sm text-foreground">{formatPercent(item.reachPercent)}</td>
      <td className="py-3 pr-4 text-sm text-foreground">
        {item.isCurrentMonth ? formatInteger(item.projectedOrders) : "—"}
      </td>
      <td className="py-3 text-sm text-foreground">
        {item.isCurrentMonth ? formatPercent(item.projectedReachPercent) : "—"}
      </td>
    </tr>
  );
}

// Panel de metas mensuales de "Visitas" (= órdenes, ver plan-history):
// meta guardada por tienda, real hasta ayer, % de alcance, y para el mes
// en curso una proyección de cierre por ritmo diario. Independiente del
// rango de fechas del SalesFiltersBar de arriba — este panel navega por
// mes calendario, no por rango libre.
export function GoalsPanel() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const summary = useGoalsSummary(year, month);
  const upsert = useUpsertGoal();
  const [savingStoreId, setSavingStoreId] = useState<number | null>(null);

  function goToPreviousMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (isNextMonthDisabled) return;
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // No tiene sentido ver (ni fijar metas de) un mes que todavía no llega.
  const isNextMonthDisabled =
    year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

  function handleSave(item: GoalSummaryItem, targetOrders: number) {
    setSavingStoreId(item.posConfigId);
    upsert.mutate(
      { posConfigId: item.posConfigId, year, month, targetOrders },
      { onSettled: () => setSavingStoreId(null) },
    );
  }

  const isCurrentMonth = summary.data?.[0]?.isCurrentMonth ?? (year === now.getFullYear() && month === now.getMonth() + 1);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Metas por tienda</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Meta mensual de visitas, avance real y proyección de cierre por ritmo diario.
          </p>
        </div>
        <div className="flex items-center gap-1 self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={goToPreviousMonth}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="w-32 text-center text-sm font-medium text-foreground capitalize">
            {MONTH_LABELS[month - 1]} {year}
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

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-normal">Tienda</th>
              <th className="pb-2 pr-4 font-normal">Meta</th>
              <th className="pb-2 pr-4 font-normal">Real{isCurrentMonth ? " (hasta ayer)" : ""}</th>
              <th className="pb-2 pr-4 font-normal">Alcance</th>
              <th className="pb-2 pr-4 font-normal">Proyección</th>
              <th className="pb-2 font-normal">% proyectado</th>
            </tr>
          </thead>
          <tbody>
            {summary.isLoading ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : summary.isError ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-sm text-destructive">
                  No se pudo cargar el resumen de metas{summary.error?.message ? `: ${summary.error.message}` : "."}
                </td>
              </tr>
            ) : summary.data && summary.data.length > 0 ? (
              summary.data.map((item) => (
                <GoalRow
                  key={item.posConfigId}
                  item={item}
                  isSaving={savingStoreId === item.posConfigId}
                  onSave={(targetOrders) => handleSave(item, targetOrders)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
                  Sin tiendas activas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
