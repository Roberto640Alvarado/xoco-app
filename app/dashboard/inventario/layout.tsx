"use client";

import { InventoryAccessGate } from "@/features/inventory-access/components/inventory-access-gate";
import { InventoryVisibilityNotice } from "@/features/inventory-access/components/inventory-visibility-notice";

// Envoltorio común de las pantallas de Inventario: el Vendedor solo entra
// si su tienda fue habilitada (InventoryAccessGate) y Admin/Finanzas ven el
// aviso de visibilidad con la recomendación de cargar primero el stock.
export default function InventarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <InventoryAccessGate>
      <div className="flex flex-col gap-4">
        <InventoryVisibilityNotice />
        {children}
      </div>
    </InventoryAccessGate>
  );
}
