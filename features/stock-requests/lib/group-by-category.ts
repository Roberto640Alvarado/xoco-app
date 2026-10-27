export interface CategoryGroup<T> {
  category: string;
  items: T[];
}

const NO_CATEGORY = "Sin categoría";

/** Agrupa por categoría (orden alfabético) con los productos de cada una también ordenados por nombre. */
export function groupByCategory<T extends { categoryName: string; productName: string }>(items: T[]): CategoryGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.categoryName?.trim() || NO_CATEGORY;
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([category, groupItems]) => ({
      category,
      items: [...groupItems].sort((a, b) => a.productName.localeCompare(b.productName, "es")),
    }));
}

/** Cantidad con su unidad: "12" / "1.5 kg". */
export function formatLineQuantity(quantity: number, unit: "unidad" | "kg"): string {
  const text = Number.isInteger(quantity) ? String(quantity) : String(Math.round(quantity * 100) / 100);
  return unit === "kg" ? `${text} kg` : text;
}
