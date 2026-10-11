import { InventoryAccessPanel } from "@/features/inventory-access/components/inventory-access-panel";
import { InventoryGuideBar } from "@/features/inventory-guide/components/inventory-guide-bar";

export default function AdminInventoryPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inventario por tienda</h1>
        <p className="mt-1 text-sm text-muted-foreground">Elige en qué tiendas los Vendedores ya pueden usar Inventario.</p>
      </div>

      <InventoryGuideBar />
      <InventoryAccessPanel />
    </div>
  );
}
