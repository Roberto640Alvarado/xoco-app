// Helpers de mes calendario (año + mes 1-12), compartidos entre los
// módulos que navegan mes a mes (Tráfico de tiendas, Tráfico Diario). No
// se tocó lib/format.ts ni el navegador de mes que ya tenía
// features/goals/components/traffic-goals-table.tsx para no arriesgar
// esa vista que ya está probada — esto es para código nuevo.

export interface MonthRef {
  year: number;
  month: number; // 1-12
}

export const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function daysInMonthOf(ref: MonthRef): number {
  return new Date(ref.year, ref.month, 0).getDate();
}

export function previousMonthOf(ref: MonthRef): MonthRef {
  return ref.month === 1 ? { year: ref.year - 1, month: 12 } : { year: ref.year, month: ref.month - 1 };
}

export function nextMonthOf(ref: MonthRef): MonthRef {
  return ref.month === 12 ? { year: ref.year + 1, month: 1 } : { year: ref.year, month: ref.month + 1 };
}

export function isSameMonth(a: MonthRef, b: MonthRef): boolean {
  return a.year === b.year && a.month === b.month;
}

export function currentMonthRef(now: Date = new Date()): MonthRef {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** "julio 2026" — minúscula; el resto de la app aplica mayúscula inicial
 * por CSS (clase `capitalize`) en vez de acá. */
export function monthLabel(ref: MonthRef): string {
  return `${MONTH_LABELS[ref.month - 1]} ${ref.year}`;
}

/** "Julio" — con mayúscula real, para títulos donde no aplica `capitalize`
 * por CSS (ej. el título dinámico de una gráfica). */
export function monthName(ref: MonthRef): string {
  const label = MONTH_LABELS[ref.month - 1];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Rango de fechas de un mes calendario completo (YYYY-MM-01 al último
 * día) — excepto si `ref` es el mes en curso, donde se corta hoy (no tiene
 * sentido pedir días futuros a /sales/daily-summary). */
export function monthDateRange(ref: MonthRef, now: Date = new Date()): { dateFrom: string; dateTo: string } {
  const dateFrom = `${ref.year}-${pad2(ref.month)}-01`;
  const isCurrent = isSameMonth(ref, currentMonthRef(now));
  const lastDay = isCurrent ? now.getDate() : daysInMonthOf(ref);
  const dateTo = `${ref.year}-${pad2(ref.month)}-${pad2(lastDay)}`;
  return { dateFrom, dateTo };
}
