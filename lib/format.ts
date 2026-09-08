const currencyFormatter = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("es-SV");

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(Math.round(value));
}

/** "2026-09-02" -> "2 sep" (para ticks del eje X / tooltips). */
export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short" }).format(date);
}

/** "2026-09-02" -> "martes, 2 de septiembre de 2026" (tooltip completo). */
export function formatLongDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** YYYY-MM-DD de "hace N días" en la zona horaria local. */
export function isoDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
