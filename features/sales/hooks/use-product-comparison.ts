"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductComparison } from "../api/sales.api";
import type { ProductComparisonPeriods } from "../types/sales.types";

/** Comparación de productos entre dos períodos. `enabled` en false evita
 * pedir datos mientras los períodos no pasen la validación del cliente
 * (mismas reglas que la API: inicio <= fin y máximo 366 días). */
export function useProductComparison(periods: ProductComparisonPeriods, posConfigId?: number, enabled = true) {
  return useQuery({
    queryKey: ["sales", "product-comparison", periods, posConfigId],
    queryFn: () => fetchProductComparison(periods, posConfigId),
    enabled,
  });
}
