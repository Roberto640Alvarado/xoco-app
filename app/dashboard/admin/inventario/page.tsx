import { InventoryAccessPanel } from "@/features/inventory-access/components/inventory-access-panel";

export default function AdminInventoryPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inventario por tienda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Decide en qué tiendas los Vendedores ya pueden usar Inventario. Admin y Finanzas lo usan siempre.
        </p>
      </div>

      <InventoryAccessPanel />
    </div>
  );
}
