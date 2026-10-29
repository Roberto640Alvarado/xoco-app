// Sustitutos de planta ("piden tiramisú, no hay, se manda brownie"): una
// línea agregada por planta con `replacesProductId` apunta al producto
// PEDIDO al que reemplaza. Estas utilidades las comparten el editor de
// planta, la vista previa, el detalle, la recepción y el PDF.

interface SubstitutableLine {
  productId: number;
  productName: string;
  replacesProductId: number | null;
}

/** Líneas que van "en lugar de" `productId`. */
export function substitutesOf<T extends SubstitutableLine>(productId: number, lines: T[]): T[] {
  return lines.filter((line) => line.replacesProductId === productId);
}

/** Nombre del producto pedido al que sustituye esta línea, o null. */
export function replacedName(line: SubstitutableLine, lines: SubstitutableLine[]): string | null {
  if (line.replacesProductId == null) return null;
  return lines.find((item) => item.productId === line.replacesProductId)?.productName ?? null;
}

/** Saca de la lista a los sustitutos (se muestran anidados bajo su original). */
export function withoutSubstitutes<T extends SubstitutableLine>(lines: T[]): T[] {
  return lines.filter((line) => line.replacesProductId == null);
}
