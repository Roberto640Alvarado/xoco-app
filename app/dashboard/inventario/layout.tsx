"use client";

import { InventoryAccessGate } from "@/features/inventory-access/components/inventory-access-gate";
import { InventoryGuideBar } from "@/features/inventory-guide/components/inventory-guide-bar";

// Envoltorio común de las pantallas de Inventario: el Vendedor solo entra
// si su tienda fue habilitada (InventoryAccessGate).
// Todos ven la card del Tour guiado (Cómo funciona + recorrido por rol).
export default function InventarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <InventoryAccessGate>
      <div className="flex flex-col gap-4">
        <InventoryGuideBar />
        {children}
      </div>
    </InventoryAccessGate>
  );
}
