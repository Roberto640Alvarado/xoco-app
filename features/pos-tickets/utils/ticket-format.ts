import type { InfoBadgeTone } from "@/design-system/components/info-badge";
import { formatCurrency, formatKg } from "@/lib/format";
import type { PosTicketLine } from "../types/pos-tickets.types";

// Estados de pos.order en Odoo (las canceladas no llegan a esta pantalla).
const STATE_INFO: Record<string, { label: string; tone: InfoBadgeTone }> = {
  draft: { label: "Abierta", tone: "warning" },
  paid: { label: "Pagada", tone: "success" },
  done: { label: "Cerrada", tone: "neutral" },
  invoiced: { label: "Facturada", tone: "info" },
  cancel: { label: "Cancelada", tone: "danger" },
};

export function ticketState(state: string): { label: string; tone: InfoBadgeTone } {
  return STATE_INFO[state] ?? { label: state, tone: "neutral" };
}

const QUANTITY = new Intl.NumberFormat("es-SV", { maximumFractionDigits: 3 });

/** "2" para piezas o "0.25 kg" para granel (la API ya convierte a kg). */
export function formatLineQuantity(line: PosTicketLine): string {
  if (line.quantityKg !== null) return formatKg(line.quantityKg);
  return QUANTITY.format(line.quantity);
}

export function formatTicketTime(date: string, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const at = new Date(`${date}T00:00:00`);
  at.setHours(hours, minutes);
  return new Intl.DateTimeFormat("es-SV", { hour: "numeric", minute: "2-digit" }).format(at);
}

/** Número que se muestra de la orden: el del recibo si existe, si no el interno. */
export function ticketNumber(ticket: { name: string; posReference: string | null }): string {
  return ticket.posReference ?? ticket.name;
}

/** Precio unitario: "$0.89" por pieza, o "$36.17 por kg" para granel
 * (Odoo lo da por su unidad, ej. por gramo, que no se lee bien). */
export function formatLinePrice(line: PosTicketLine): string {
  if (line.quantityKg !== null && line.quantityKg > 0) {
    return `${formatCurrency((line.priceUnit * line.quantity) / line.quantityKg)} por kg`;
  }
  return formatCurrency(line.priceUnit);
}

const LONG_DATE = new Intl.DateTimeFormat("es-SV", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const DAY_HEADER = new Intl.DateTimeFormat("es-SV", { weekday: "long", day: "numeric", month: "long" });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Martes, 20 de octubre de 2026 a las 6:23 p. m." */
export function formatTicketLongDateTime(date: string, time: string): string {
  return `${capitalize(LONG_DATE.format(new Date(`${date}T00:00:00`)))} a las ${formatTicketTime(date, time)}`;
}

/** Encabezado de un día en el listado: "Martes 20 de octubre" (con "Hoy"/"Ayer" si aplica). */
export function formatDayHeader(date: string, today: string, yesterday: string): string {
  const label = capitalize(DAY_HEADER.format(new Date(`${date}T00:00:00`))).replace(",", "");
  if (date === today) return `Hoy, ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
  if (date === yesterday) return `Ayer, ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
  return label;
}

/** "6:23 p. m." partido en hora y sufijo, para mostrar la hora grande. */
export function splitTicketTime(date: string, time: string): { clock: string; period: string } {
  const formatted = formatTicketTime(date, time);
  const match = formatted.match(/^(\S+)\s*(.*)$/);
  return { clock: match?.[1] ?? formatted, period: match?.[2] ?? "" };
}
