"use client";

import { InventoryRequestsView } from "@/features/inventory-movements/components/inventory-requests-view";

// Solicitudes de stock — cuarta pantalla del submenú Inventario: el
// Vendedor pide y sigue sus solicitudes; Admin/Finanzas las atiende desde
// una bandeja con todas las tiendas.
export default function InventarioSolicitudesPage() {
  return <InventoryRequestsView />;
}
