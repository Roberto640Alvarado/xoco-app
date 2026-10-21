"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { ChevronDown, GitCompareArrows } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthNavigator } from "@/components/filters/month-navigator";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ComparisonPeriodRange, ProductComparisonPeriods } from "../types/sales.types";
import {
  COMPARISON_PRESETS,
  formatPeriodLabel,
  fromIsoDate,
  matchingPreset,
  monthEnd,
  monthRange,
  monthStart,
  toIsoDate,
  todayLocalIso,
  validatePeriods,
  type ComparisonPreset,
} from "../utils/comparison-periods";

type Mode = "presets" | "months" | "custom";
type PeriodKey = "a" | "b";

const PERIOD_NAME: Record<PeriodKey, string> = { a: "Período A", b: "Período B" };
const PERIOD_COLOR: Record<PeriodKey, string> = { a: "var(--color-chart-1)", b: "var(--color-chart-2)" };

interface PeriodComparisonFilterProps {
  value: ProductComparisonPeriods;
  onChange: (value: ProductComparisonPeriods) => void;
  className?: string;
}

function toDateRange(range: ComparisonPeriodRange): DateRange {
  return { from: fromIsoDate(range.dateFrom), to: fromIsoDate(range.dateTo) };
}

function fromDateRange(range: DateRange | undefined): ComparisonPeriodRange | null {
  if (!range?.from) return null;
  return { dateFrom: toIsoDate(range.from), dateTo: toIsoDate(range.to ?? range.from) };
}

function monthLabel(month: string): string {
  const dateFrom = `${month}-01`;
  return formatPeriodLabel({ dateFrom, dateTo: monthEnd(dateFrom) }, "");
}

function PeriodDot({ period }: { period: PeriodKey }) {
  return <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: PERIOD_COLOR[period] }} aria-hidden="true" />;
}

/**
 * Filtro de "qué comparar" de la pantalla Comparación de productos: dos
 * períodos (A = principal, B = contra el que se compara). Mismo patrón que
 * DateRangeFilter: atajos a la izquierda y, para "Elegir meses" o
 * "Personalizado", un editor a la derecha que se aplica con un botón. Las
 * reglas de validación son las mismas de la API (inicio <= fin, máximo 366
 * días por período).
 */
export function PeriodComparisonFilter({ value, onChange, className }: PeriodComparisonFilterProps) {
  const isMobile = useIsMobile();
  const [today] = useState(todayLocalIso);
  const currentMonth = today.slice(0, 7);

  const activePreset = matchingPreset(value, today);
  const triggerLabel = activePreset
    ? activePreset.label
    : `${formatPeriodLabel(value.a, today)} vs. ${formatPeriodLabel(value.b, today)}`;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("presets");
  const [months, setMonths] = useState({ a: value.a.dateFrom.slice(0, 7), b: value.b.dateFrom.slice(0, 7) });
  const [editing, setEditing] = useState<PeriodKey>("a");
  const [custom, setCustom] = useState<Record<PeriodKey, DateRange | undefined>>({
    a: toDateRange(value.a),
    b: toDateRange(value.b),
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Cada vez que se abre, el editor arranca con lo que está aplicado.
      setMode(activePreset ? "presets" : "custom");
      setMonths({ a: value.a.dateFrom.slice(0, 7), b: value.b.dateFrom.slice(0, 7) });
      setCustom({ a: toDateRange(value.a), b: toDateRange(value.b) });
      setEditing("a");
    }
    setOpen(next);
  }

  function applyPreset(preset: ComparisonPreset) {
    onChange(preset.periods(today));
    setOpen(false);
  }

  function shiftMonth(period: PeriodKey, delta: number) {
    setMonths((prev) => ({ ...prev, [period]: monthStart(`${prev[period]}-01`, delta).slice(0, 7) }));
  }

  const draft: ProductComparisonPeriods | null =
    mode === "months"
      ? { a: monthRange(months.a, today), b: monthRange(months.b, today) }
      : mode === "custom"
        ? (() => {
            const a = fromDateRange(custom.a);
            const b = fromDateRange(custom.b);
            return a && b ? { a, b } : null;
          })()
        : null;
  const draftError = draft ? validatePeriods(draft) : mode === "custom" ? "Elige el día inicial y el final de los dos períodos." : null;

  function applyDraft() {
    if (!draft || draftError) return;
    onChange(draft);
    setOpen(false);
  }

  const modeButton = (key: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(key)}
      aria-pressed={mode === key}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted",
        mode === key ? "bg-accent font-medium text-accent-foreground" : "text-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-between gap-2 font-normal sm:w-auto sm:max-w-[360px]", className)}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2 text-foreground">
          <GitCompareArrows className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{triggerLabel}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex shrink-0 flex-col gap-0.5 border-b border-border p-2 sm:w-[260px] sm:border-r sm:border-b-0">
            <p className="px-2.5 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">Atajos</p>
            {COMPARISON_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                  mode === "presets" && activePreset?.key === preset.key
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-foreground",
                )}
              >
                {preset.label}
              </button>
            ))}
            <div className="my-1 h-px bg-border" aria-hidden="true" />
            {modeButton("months", "Elegir meses")}
            {modeButton("custom", "Personalizado")}
          </div>

          {mode === "months" && (
            <div className="flex flex-col gap-3 p-3 sm:w-[300px]">
              {(["a", "b"] as const).map((period) => (
                <div key={period} className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <PeriodDot period={period} />
                    {PERIOD_NAME[period]}
                  </span>
                  <MonthNavigator
                    label={monthLabel(months[period])}
                    onPrevious={() => shiftMonth(period, -1)}
                    onNext={() => shiftMonth(period, 1)}
                    nextDisabled={months[period] >= currentMonth}
                    className="w-full justify-between"
                  />
                  {months[period] === currentMonth && (
                    <span className="text-xs text-muted-foreground">Mes en curso: cuenta hasta hoy.</span>
                  )}
                </div>
              ))}
              <DraftFooter error={draftError} onApply={applyDraft} />
            </div>
          )}

          {mode === "custom" && (
            <div className="flex flex-col p-2">
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-0.5" role="group" aria-label="Período a editar">
                {(["a", "b"] as const).map((period) => {
                  const range = fromDateRange(custom[period]);
                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setEditing(period)}
                      aria-pressed={editing === period}
                      className={cn(
                        "flex min-w-0 flex-col items-start rounded-md px-2.5 py-1.5 text-left transition-colors",
                        editing === period ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <PeriodDot period={period} />
                        {PERIOD_NAME[period]}
                      </span>
                      <span className="w-full truncate text-xs text-muted-foreground">
                        {range ? formatPeriodLabel(range, today) : "Sin elegir"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Calendar
                key={editing}
                mode="range"
                numberOfMonths={isMobile ? 1 : 2}
                defaultMonth={custom[editing]?.from ?? fromIsoDate(today)}
                selected={custom[editing]}
                onSelect={(range) => setCustom((prev) => ({ ...prev, [editing]: range }))}
                disabled={{ after: fromIsoDate(today) }}
              />
              <div className="border-t border-border px-1 pt-2">
                <DraftFooter error={draftError} onApply={applyDraft} />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DraftFooter({ error, onApply }: { error: string | null; onApply: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>
        {error ?? "Listo para comparar."}
      </p>
      <Button type="button" size="sm" onClick={onApply} disabled={!!error}>
        Aplicar
      </Button>
    </div>
  );
}
