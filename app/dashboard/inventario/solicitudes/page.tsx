"use client";

import { StockRequestsView } from "@/features/stock-requests/components/stock-requests-view";

// Solicitudes de stock — cuarta pantalla del submenú Inventario: la tienda
// pide y confirma lo que llega, planta responde y despacha, Admin/Finanzas
// hacen seguimiento.
export default function InventarioSolicitudesPage() {
  return <StockRequestsView />;
}
