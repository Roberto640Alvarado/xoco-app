// Fechas "YYYY-MM-DD" en hora LOCAL del navegador. `toISOString()` da la
// fecha UTC: en El Salvador (UTC-6), después de las 6 p. m. ya marca el día
// siguiente, así que los filtros nuevos usan estas funciones.

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function fromIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function isIsoDate(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(fromIsoDate(value).getTime());
}

export function todayLocalIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}
