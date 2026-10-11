"use client";

import { InventoryMovementsView } from "@/features/inventory-movements/components/inventory-movements-view";

// Movimientos de inventario (merma, regalías, degustaciones) — segundo
// tramo de Inventario, ver plan-history. A diferencia de /dashboard/inventario,
// esta pantalla sí es visible para Vendedor (forzado a su propia tienda).
export default function InventarioMovimientosPage() {
  return <InventoryMovementsView />;
}
