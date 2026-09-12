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

const percentFormatter = new Intl.NumberFormat("es-SV", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(Math.round(value));
}

/** 0.0725 -> "7.3%". `null`/`undefined` (sin meta guardada) -> "—". */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return percentFormatter.format(value);
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

const kgFormatter = new Intl.NumberFormat("es-SV", { maximumFractionDigits: 2 });

/** 0.75 -> "0.75 kg" — para productos a granel (ver "Productos a granel (Kg)"). */
export function formatKg(value: number): string {
  return `${kgFormatter.format(value)} kg`;
}

/** "2026-09-01" -> "Septiembre 2026" (para la comparación mes en curso / mes anterior). */
export function formatMonthLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const label = new Intl.DateTimeFormat("es-SV", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
