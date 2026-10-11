import { Warehouse } from "lucide-react";
import { SectionCard } from "@/design-system/components/section-card";
import { InventoryAccessPanel } from "@/features/inventory-access/components/inventory-access-panel";
import { InventoryGuideBar } from "@/features/inventory-guide/components/inventory-guide-bar";

export default function AdminInventoryPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <InventoryGuideBar />
      <SectionCard
        icon={Warehouse}
        title="Inventario por tienda"
        description="Elige en qué tiendas los Vendedores ya pueden usar Inventario."
      />
      <InventoryAccessPanel />
    </div>
  );
}
