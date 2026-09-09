// Helpers puros para agregar los 3 endpoints de metas ya existentes
// (/goals, /sales-goals, /ticket-goals) en los totales de una sola
// empresa que necesita "Cierre del mes" — sin tocar xoco-api, este
// módulo es 100% de lectura sobre datos que ya exponen esos 3 módulos.

/** Suma tienda por tienda; si a alguna le falta el valor (meta sin
 * configurar), el total tampoco se puede calcular. */
export function sumOrNull(values: Array<number | null>): number | null {
  if (values.length === 0 || values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

/** Promedio simple entre tiendas — igual mecanismo que la fila
 * "Promedio" de Ticket Promedio (features/ticket-goals/), no una suma:
 * un ticket promedio no tiene sentido sumado entre tiendas. */
export function averageOrNull(values: Array<number | null>): number | null {
  if (values.length === 0 || values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0) / values.length;
}

export function divideOrNull(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || !denominator) return null;
  return numerator / denominator;
}

/** "Crecimiento o decrecimiento vs [mes anterior]" — % de cambio del
 * cierre del mes actual contra el total del mes anterior. `null` si no
 * hay una base contra la cual comparar (mes anterior en cero o sin dato). */
export function growthOrNull(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return (current - previous) / previous;
}

// Una sección del módulo (Tráfico / Venta / Ticket Promedio): mismos 5
// campos, sea cual sea la unidad (órdenes, $, $ de ticket).
export interface MonthCloseSection {
  previousTotal: number | null;
  closeTotal: number | null;
  growthPercent: number | null;
  target: number | null;
  reachPercent: number | null;
}

export function buildSection(previousTotal: number | null, closeTotal: number | null, target: number | null): MonthCloseSection {
  return {
    previousTotal,
    closeTotal,
    growthPercent: growthOrNull(closeTotal, previousTotal),
    target,
    reachPercent: divideOrNull(closeTotal, target),
  };
}
