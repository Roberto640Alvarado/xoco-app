"use client";

import { useState } from "react";
import { CalendarIcon, ChevronDown, Clock } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toIsoDate } from "@/lib/local-date";

const LABEL_FORMATTER = new Intl.DateTimeFormat("es-SV", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const HOUR_FORMATTER = new Intl.DateTimeFormat("es-SV", { hour: "numeric" });

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** "AAAA-MM-DDTHH:MM" en hora local (mismo formato que un datetime-local). */
export function toLocalDateTime(date: Date): string {
  return `${toIsoDate(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function fromLocalDateTime(value: string): Date {
  return new Date(value);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function combine(day: Date, hour: number, minute: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
// Minutos de 5 en 5; si el valor actual no cae en uno, se agrega para no perderlo.
function minuteOptions(current: number): number[] {
  const base = Array.from({ length: 12 }, (_, index) => index * 5);
  return base.includes(current) ? base : [...base, current].sort((a, b) => a - b);
}

interface DateTimePickerProps {
  /** "AAAA-MM-DDTHH:MM" en hora local. */
  value: string;
  onChange: (value: string) => void;
  /** Lo más atrás que se puede elegir (ej. hace 7 días). */
  min?: Date;
  /** Lo más adelante que se puede elegir (por defecto, ahora). */
  max?: Date;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Fecha y hora con el mismo calendario del panel (`Calendar` de
 * DateRangeFilter) en vez del selector nativo del navegador: botón
 * `outline` con la fecha formateada; al abrir, calendario de un día, hora y
 * minutos con `Select`, y "Aplicar". Lo usa la fecha del Conteo.
 */
export function DateTimePicker({ value, onChange, min, max, disabled, ariaLabel = "Fecha y hora", className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const current = fromLocalDateTime(value);
  const [day, setDay] = useState<Date | undefined>(startOfDay(current));
  const [hour, setHour] = useState(current.getHours());
  const [minute, setMinute] = useState(current.getMinutes());

  const limitMax = max ?? new Date();
  const pending = day ? combine(day, hour, minute) : null;
  const error = !pending
    ? null
    : pending > limitMax
      ? "La hora no puede ser en el futuro."
      : min && pending < min
        ? `Solo se puede desde el ${LABEL_FORMATTER.format(min)}.`
        : null;

  function handleOpenChange(next: boolean) {
    if (next) {
      // Al abrir arranca con el valor aplicado.
      setDay(startOfDay(current));
      setHour(current.getHours());
      setMinute(current.getMinutes());
    }
    setOpen(next);
  }

  function apply() {
    if (!pending || error) return;
    onChange(toLocalDateTime(pending));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={ariaLabel}
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn("justify-between gap-2 font-normal", className)}
          />
        }
      >
        <span className="flex items-center gap-2 text-foreground">
          <CalendarIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          {LABEL_FORMATTER.format(current)}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          numberOfMonths={1}
          defaultMonth={day ?? current}
          selected={day}
          onSelect={setDay}
          disabled={[{ after: limitMax }, ...(min ? [{ before: startOfDay(min) }] : [])]}
        />
        <div className="flex items-center gap-2 border-t border-border px-1 pt-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">Hora</span>
          <Select value={String(hour)} onValueChange={(next) => setHour(Number(next))}>
            <SelectTrigger aria-label="Hora" className="h-8 w-24 gap-1 text-sm">
              <SelectValue>{(raw: string) => HOUR_FORMATTER.format(new Date(2000, 0, 1, Number(raw)))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {HOUR_FORMATTER.format(new Date(2000, 0, 1, option))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">:</span>
          <Select value={String(minute)} onValueChange={(next) => setMinute(Number(next))}>
            <SelectTrigger aria-label="Minutos" className="h-8 w-20 gap-1 text-sm tabular-nums">
              <SelectValue>{(raw: string) => pad2(Number(raw))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {minuteOptions(minute).map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {pad2(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-border px-1 pt-2">
          <p className={cn("max-w-48 text-xs", error ? "text-destructive" : "text-muted-foreground")}>
            {error ?? (pending ? LABEL_FORMATTER.format(pending) : "Elige un día")}
          </p>
          <Button type="button" size="sm" onClick={apply} disabled={!pending || error != null}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
