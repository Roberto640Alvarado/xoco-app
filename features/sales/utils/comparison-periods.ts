import { addDaysIso as addDays, fromIsoDate, isIsoDate, toIsoDate, todayLocalIso } from "@/lib/local-date";
import type { ComparisonPeriodRange, ProductComparisonPeriods } from "../types/sales.types";

// Fechas y atajos de la pantalla Comparación de productos. Todo se calcula
// en fecha LOCAL ("YYYY-MM-DD" sin zona), igual que los filtros de fecha
// del resto del panel: `toISOString()` corre el día después de las 6 p. m.
// en El Salvador (UTC-6).

/** Mismo tope que la API (MAX_COMPARISON_PERIOD_DAYS en SalesService). */
export const MAX_COMPARISON_PERIOD_DAYS = 366;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export { fromIsoDate, isIsoDate, toIsoDate, todayLocalIso };

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Primer día del mes de `iso`, corrido `months` meses. */
export function monthStart(iso: string, months = 0): string {
  const date = fromIsoDate(iso);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + months, 1));
}

export function monthEnd(iso: string): string {
  const date = fromIsoDate(iso);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** Mismo día del mes en `monthFirstDay`, sin pasarse de su último día (31 → 30/28). */
function sameDayIn(monthFirstDay: string, day: number): string {
  const last = fromIsoDate(monthEnd(monthFirstDay)).getDate();
  return `${monthFirstDay.slice(0, 8)}${pad2(Math.min(day, last))}`;
}

export function daysInRange(range: ComparisonPeriodRange): number {
  return Math.round((fromIsoDate(range.dateTo).getTime() - fromIsoDate(range.dateFrom).getTime()) / MS_PER_DAY) + 1;
}

/** Rango de un mes ("YYYY-MM"): del día 1 al último, o hasta hoy si es el mes en curso. */
export function monthRange(month: string, today: string): ComparisonPeriodRange {
  const dateFrom = `${month}-01`;
  const end = monthEnd(dateFrom);
  return { dateFrom, dateTo: end > today ? today : end };
}

export interface ComparisonPreset {
  key: string;
  label: string;
  periods: (today: string) => ProductComparisonPeriods;
}

export const COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    key: "month-vs-previous",
    label: "Mes actual vs. mes anterior",
    periods: (today) => {
      const previous = monthStart(today, -1);
      return { a: { dateFrom: monthStart(today), dateTo: today }, b: { dateFrom: previous, dateTo: monthEnd(previous) } };
    },
  },
  {
    key: "month-vs-previous-same-days",
    label: "Mes actual vs. mismos días del mes anterior",
    periods: (today) => {
      const previous = monthStart(today, -1);
      const day = fromIsoDate(today).getDate();
      return { a: { dateFrom: monthStart(today), dateTo: today }, b: { dateFrom: previous, dateTo: sameDayIn(previous, day) } };
    },
  },
  {
    key: "month-vs-last-year",
    label: "Mes actual vs. mismo mes del año pasado",
    periods: (today) => {
      const lastYear = monthStart(today, -12);
      const day = fromIsoDate(today).getDate();
      return { a: { dateFrom: monthStart(today), dateTo: today }, b: { dateFrom: lastYear, dateTo: sameDayIn(lastYear, day) } };
    },
  },
  {
    key: "last-two-full-months",
    label: "Últimos dos meses completos",
    periods: (today) => {
      const a = monthStart(today, -1);
      const b = monthStart(today, -2);
      return { a: { dateFrom: a, dateTo: monthEnd(a) }, b: { dateFrom: b, dateTo: monthEnd(b) } };
    },
  },
  {
    key: "last-30-vs-previous-30",
    label: "Últimos 30 días vs. 30 días previos",
    periods: (today) => {
      const aFrom = addDays(today, -29);
      return { a: { dateFrom: aFrom, dateTo: today }, b: { dateFrom: addDays(aFrom, -30), dateTo: addDays(aFrom, -1) } };
    },
  },
];

export const DEFAULT_COMPARISON_PRESET = COMPARISON_PRESETS[0];

function sameRange(x: ComparisonPeriodRange, y: ComparisonPeriodRange): boolean {
  return x.dateFrom === y.dateFrom && x.dateTo === y.dateTo;
}

export function matchingPreset(periods: ProductComparisonPeriods, today: string): ComparisonPreset | null {
  return (
    COMPARISON_PRESETS.find((preset) => {
      const candidate = preset.periods(today);
      return sameRange(candidate.a, periods.a) && sameRange(candidate.b, periods.b);
    }) ?? null
  );
}

/** Mismas reglas que la API: inicio <= fin y máximo 366 días por período. */
export function validatePeriod(label: "A" | "B", range: ComparisonPeriodRange): string | null {
  if (range.dateFrom > range.dateTo) return `En el período ${label}, la fecha inicial no puede ser posterior a la final.`;
  if (daysInRange(range) > MAX_COMPARISON_PERIOD_DAYS) {
    return `El período ${label} no puede ser mayor a ${MAX_COMPARISON_PERIOD_DAYS} días.`;
  }
  return null;
}

export function validatePeriods(periods: ProductComparisonPeriods): string | null {
  return validatePeriod("A", periods.a) ?? validatePeriod("B", periods.b);
}

const MONTH_YEAR = new Intl.DateTimeFormat("es-SV", { month: "long", year: "numeric" });
const DAY_MONTH = new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short" });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short", year: "numeric" });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Nombre corto de un período para leyendas, encabezados y tooltips:
 * - mes completo → "Septiembre 2026"
 * - mes en curso hasta hoy → "Octubre 2026 (al 20)"
 * - dentro de un mismo mes → "1–20 sept 2026"
 * - cualquier otro rango → "21 sept – 20 oct 2026" / "15 dic 2025 – 14 ene 2026"
 */
export function formatPeriodLabel(range: ComparisonPeriodRange, today: string): string {
  const from = fromIsoDate(range.dateFrom);
  const to = fromIsoDate(range.dateTo);
  const startsMonth = from.getDate() === 1;
  const sameMonth = range.dateFrom.slice(0, 7) === range.dateTo.slice(0, 7);
  if (startsMonth && sameMonth && range.dateTo === monthEnd(range.dateFrom)) return capitalize(MONTH_YEAR.format(from));
  if (startsMonth && sameMonth && range.dateTo === today) return `${capitalize(MONTH_YEAR.format(from))} (al ${to.getDate()})`;
  if (range.dateFrom === range.dateTo) return DAY_MONTH_YEAR.format(from);
  if (sameMonth) return `${from.getDate()}–${DAY_MONTH_YEAR.format(to)}`;
  const fromLabel = from.getFullYear() === to.getFullYear() ? DAY_MONTH.format(from) : DAY_MONTH_YEAR.format(from);
  return `${fromLabel} – ${DAY_MONTH_YEAR.format(to)}`;
}

export interface ChangeValue {
  diff: number;
  /** null cuando el período B es 0 (no hay base para un porcentaje). */
  pct: number | null;
}

export function computeChange(a: number, b: number): ChangeValue {
  return { diff: a - b, pct: b === 0 ? null : (a - b) / b };
}
