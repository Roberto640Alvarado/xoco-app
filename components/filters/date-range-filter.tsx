"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRangeValue {
  dateFrom: string // YYYY-MM-DD
  dateTo: string // YYYY-MM-DD
}

interface DateRangeFilterProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  /** Fecha máxima seleccionable (YYYY-MM-DD) — por defecto, hoy: no tiene
   * sentido pedir datos de ventas del futuro. */
  maxDate?: string
  className?: string
}

interface Preset {
  key: string
  label: string
  range: (today: Date) => DateRangeValue
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

/** Fecha local (no UTC) a "YYYY-MM-DD" — evita el corrimiento de un día
 * que da `toISOString()` cerca de medianoche fuera de UTC. */
function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** "YYYY-MM-DD" -> Date a medianoche LOCAL (mismo criterio que
 * lib/format.ts: `new Date(iso + "T00:00:00")`). */
function fromIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const PRESETS: Preset[] = [
  {
    key: "today",
    label: "Hoy",
    range: (today) => ({ dateFrom: toIsoDate(today), dateTo: toIsoDate(today) }),
  },
  {
    key: "last7",
    label: "Últimos 7 días",
    range: (today) => ({ dateFrom: toIsoDate(addDays(today, -6)), dateTo: toIsoDate(today) }),
  },
  {
    key: "last30",
    label: "Últimos 30 días",
    range: (today) => ({ dateFrom: toIsoDate(addDays(today, -29)), dateTo: toIsoDate(today) }),
  },
  {
    key: "thisMonth",
    label: "Mes actual",
    range: (today) => ({
      dateFrom: `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-01`,
      dateTo: toIsoDate(today),
    }),
  },
  {
    key: "lastMonth",
    label: "Mes anterior",
    range: (today) => {
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      return { dateFrom: toIsoDate(lastMonthStart), dateTo: toIsoDate(lastMonthEnd) }
    },
  },
  {
    key: "thisYear",
    label: "Todo este año",
    range: (today) => ({ dateFrom: `${today.getFullYear()}-01-01`, dateTo: toIsoDate(today) }),
  },
];

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short" });
const SHORT_DATE_WITH_YEAR_FORMATTER = new Intl.DateTimeFormat("es-SV", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatRangeLabel(value: DateRangeValue): string {
  const from = fromIsoDate(value.dateFrom);
  const to = fromIsoDate(value.dateTo);
  const sameYear = from.getFullYear() === to.getFullYear();
  const fromLabel = sameYear ? SHORT_DATE_FORMATTER.format(from) : SHORT_DATE_WITH_YEAR_FORMATTER.format(from);
  const toLabel = SHORT_DATE_WITH_YEAR_FORMATTER.format(to);
  if (value.dateFrom === value.dateTo) return toLabel;
  return `${fromLabel} – ${toLabel}`;
}

function matchingPresetKey(value: DateRangeValue, today: Date): string | null {
  for (const preset of PRESETS) {
    const presetRange = preset.range(today);
    if (presetRange.dateFrom === value.dateFrom && presetRange.dateTo === value.dateTo) return preset.key;
  }
  return null;
}

/** Filtro de rango de fechas reutilizado en toda la app: un botón que
 * abre un "downlist" con atajos (Hoy / Últimos 7 días / ... / Todo este
 * año) a la izquierda y un calendario de rango a la derecha para
 * "Personalizado". Reemplaza los pares sueltos de <Input type="date"> +
 * botones de "7/30/90 días" que tenía cada vista. */
export function DateRangeFilter({ value, onChange, maxDate, className }: DateRangeFilterProps) {
  const today = React.useMemo(() => new Date(), []);
  const max = React.useMemo(() => (maxDate ? fromIsoDate(maxDate) : today), [maxDate, today]);

  const [open, setOpen] = React.useState(false);
  const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>({
    from: fromIsoDate(value.dateFrom),
    to: fromIsoDate(value.dateTo),
  });

  const activePresetKey = matchingPresetKey(value, today);
  const triggerLabel = activePresetKey
    ? PRESETS.find((p) => p.key === activePresetKey)!.label
    : formatRangeLabel(value);

  function handleOpenChange(next: boolean) {
    if (next) {
      // Al abrir, el calendario arranca sincronizado con el rango activo
      // (si el usuario ya tenía un rango personalizado aplicado).
      setPendingRange({ from: fromIsoDate(value.dateFrom), to: fromIsoDate(value.dateTo) });
    }
    setOpen(next);
  }

  function applyPreset(preset: Preset) {
    onChange(preset.range(today));
    setOpen(false);
  }

  function applyCustomRange() {
    if (!pendingRange?.from) return;
    const from = pendingRange.from;
    const to = pendingRange.to ?? pendingRange.from;
    onChange({ dateFrom: toIsoDate(from), dateTo: toIsoDate(to) });
    setOpen(false);
  }

  const hasPendingCustomRange = pendingRange?.from != null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("justify-between gap-2 font-normal sm:w-[240px]", className)}
          />
        }
      >
        <span className="flex items-center gap-2 text-foreground">
          <CalendarIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          {triggerLabel}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex shrink-0 flex-col gap-0.5 border-b border-border p-2 sm:w-[168px] sm:border-r sm:border-b-0">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                  activePresetKey === preset.key
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
            <div className="my-1 h-px bg-border" aria-hidden="true" />
            <span
              className={cn(
                "rounded-md px-2.5 py-1.5 text-left text-sm font-medium",
                !activePresetKey ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              Personalizado
            </span>
          </div>

          <div className="flex flex-col p-2">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={pendingRange?.from ?? fromIsoDate(value.dateFrom)}
              selected={pendingRange}
              onSelect={setPendingRange}
              disabled={{ after: max }}
            />
            <div className="flex items-center justify-between gap-2 border-t border-border px-1 pt-2">
              <p className="text-xs text-muted-foreground">
                {hasPendingCustomRange && pendingRange?.from
                  ? `${SHORT_DATE_WITH_YEAR_FORMATTER.format(pendingRange.from)} – ${
                      pendingRange.to ? SHORT_DATE_WITH_YEAR_FORMATTER.format(pendingRange.to) : "…"
                    }`
                  : "Elige el día inicial y el día final"}
              </p>
              <Button type="button" size="sm" onClick={applyCustomRange} disabled={!hasPendingCustomRange}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
