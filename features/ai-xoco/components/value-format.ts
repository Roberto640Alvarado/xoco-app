import { formatCurrency, formatCurrencyCompact, formatInteger } from "@/lib/format";
import type { AiValueFormat } from "../types/ai-chat.types";

const decimal = new Intl.NumberFormat("es-SV", { maximumFractionDigits: 2 });

/** Valor de una gráfica o tabla según su formato (porcentaje en puntos: 21.5 → "21.5%"). */
export function formatValue(value: string | number | null, format: AiValueFormat | undefined, compact = false): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || format === "texto") return String(value);
  if (format === "moneda") return compact ? formatCurrencyCompact(value) : formatCurrency(value);
  if (format === "porcentaje") return `${value.toFixed(1)}%`;
  return Number.isInteger(value) ? formatInteger(value) : decimal.format(value);
}
