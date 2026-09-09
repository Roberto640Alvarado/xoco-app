import type { DailySalesPoint, Store } from "@/features/sales/types/sales.types";

// Serie diaria de venta ($) de UNA tienda, para la gráfica "comportamiento
// por tienda" del mes ancla (siempre todas las tiendas activas, sin
// importar el filtro de tienda de la página) — mismo shape que
// StoreDailySeries de features/trafico-diario/, no se compartió el tipo
// porque cada módulo queda autocontenido (ver plan-history).
export interface StoreDailyRevenueSeries {
  store: Store;
  points: DailySalesPoint[];
}
