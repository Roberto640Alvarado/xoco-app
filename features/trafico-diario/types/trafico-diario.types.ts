import type { DailySalesPoint, Store } from "@/features/sales/types/sales.types";

// Serie diaria de UNA tienda, para la gráfica "comportamiento por tienda"
// del mes ancla (siempre todas las tiendas activas, sin importar el filtro
// de tienda de la página — ver plan-history).
export interface StoreDailySeries {
  store: Store;
  points: DailySalesPoint[];
}
