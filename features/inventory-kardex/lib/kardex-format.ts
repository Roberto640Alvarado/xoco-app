import { formatInteger, formatKg, formatLongDate } from "@/lib/format";
import type { KardexEntryType, KardexProduct, KardexUnit } from "../types/inventory-kardex.types";

/** Cantidad con su unidad: "12" / "1.5 kg". null -> "—" (sin conteo). */
export function formatKardexQuantity(value: number | null, unit: KardexUnit): string {
  if (value === null) return "—";
  return unit === "kg" ? formatKg(value) : formatInteger(value);
}

/** Ajuste con signo: "+2", "−1.5 kg", "0". */
export function formatSigned(value: number | null, unit: KardexUnit): string {
  if (value === null) return "—";
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "−"}${formatKardexQuantity(Math.abs(value), unit)}`;
}

export function formatPeriod(dateFrom: string, dateTo: string): string {
  return dateFrom === dateTo ? formatLongDate(dateFrom) : `${formatLongDate(dateFrom)} al ${formatLongDate(dateTo)}`;
}

/** "Tienda Ramblas" -> "tienda-ramblas" (nombres de archivo). */
export function slug(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "tienda"
  );
}

export const TYPE_TONE: Record<KardexEntryType, string> = {
  VENTA: "text-foreground",
  MERMA: "text-destructive",
  REGALIA: "text-amber-700 dark:text-amber-300",
  DEGUSTACION: "text-amber-700 dark:text-amber-300",
  ENTRADA: "text-emerald-700 dark:text-emerald-300",
  CONTEO: "text-sky-700 dark:text-sky-300",
};

export interface CategoryBlock {
  category: string;
  products: KardexProduct[];
}

/** Productos agrupados por categoría (ya vienen ordenados de la API). */
export function byCategory(products: KardexProduct[]): CategoryBlock[] {
  const blocks: CategoryBlock[] = [];
  for (const product of products) {
    const last = blocks[blocks.length - 1];
    if (last && last.category === product.categoryName) last.products.push(product);
    else blocks.push({ category: product.categoryName, products: [product] });
  }
  return blocks;
}
