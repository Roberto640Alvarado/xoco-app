import type { DailySalesPoint, Store } from "@/features/sales/types/sales.types";

// Serie diaria (venta + órdenes, para derivar el ticket promedio) de UNA
// tienda, para la gráfica "comportamiento por tienda" del mes ancla —
// mismo shape que StoreDailySeries/StoreDailyRevenueSeries de
// trafico-diario/venta-diaria, no se compartió el tipo (cada módulo
// autocontenido, ver plan-history).
export interface StoreDailyTicketSeries {
  store: Store;
  points: DailySalesPoint[];
}

// Ticket promedio de UN día: venta / órdenes de ese día. null si no hubo
// órdenes ese día (no "$0" — evita insinuar que el ticket fue cero).
export function averageTicketOf(point: DailySalesPoint): number | null {
  return point.orderCount > 0 ? point.totalRevenue / point.orderCount : null;
}
