const HOUR = new Intl.DateTimeFormat("en-US", { timeZone: "America/El_Salvador", hour: "numeric", hourCycle: "h23" });
const LONG_DATE = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", weekday: "long", day: "numeric", month: "long" });

export type DayPart = "manana" | "tarde" | "noche";

/** Parte del día en El Salvador: mañana 5–11, tarde 12–17, noche 18–4. */
export function dayPart(date: Date = new Date()): DayPart {
  const hour = Number(HOUR.format(date));
  if (hour >= 5 && hour < 12) return "manana";
  if (hour >= 12 && hour < 18) return "tarde";
  return "noche";
}

export const GREETING: Record<DayPart, string> = {
  manana: "Buenos días",
  tarde: "Buenas tardes",
  noche: "Buenas noches",
};

/** "sábado, 1 de noviembre" con la primera letra en mayúscula. */
export function todayLabel(date: Date = new Date()): string {
  const text = LONG_DATE.format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
