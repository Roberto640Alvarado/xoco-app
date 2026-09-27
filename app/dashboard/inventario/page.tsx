"use client";

import { InventoryView } from "@/features/inventory/components/inventory-view";

// Inventario inicial por tienda (primer tramo — ver plan-history de
// Inventario): reemplaza el placeholder "En desarrollo..." que tenía
// antes. Sin filtro de fecha (a diferencia del resto del dashboard): esto
// no es un reporte por rango, es una foto del estado actual capturada a
// mano por Finanzas — ver InventoryView.
export default function InventarioPage() {
  return <InventoryView />;
}
