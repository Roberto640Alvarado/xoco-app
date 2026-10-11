"use client";

import { InventoryAccessGate } from "@/features/inventory-access/components/inventory-access-gate";
import { InventoryGuideBar } from "@/features/inventory-guide/components/inventory-guide-bar";
import { InventoryVisibilityNotice } from "@/features/inventory-access/components/inventory-visibility-notice";

// Envoltorio común de las pantallas de Inventario: el Vendedor solo entra
// si su tienda fue habilitada (InventoryAccessGate) y Admin/Finanzas ven el
// aviso de visibilidad con la recomendación de cargar primero el stock.
// Todos ven la card del Tour guiado (Cómo funciona + recorrido por rol).
export default function InventarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <InventoryAccessGate>
      <div className="flex flex-col gap-4">
        <InventoryGuideBar />
        <InventoryVisibilityNotice />
        {children}
      </div>
    </InventoryAccessGate>
  );
}
