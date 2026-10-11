"use client";

import { useState } from "react";
import { Warehouse } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { StoreSelect } from "@/components/filters/store-select";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { useInventoryItems } from "../hooks/use-inventory-items";
import { InventoryTable } from "./inventory-table";

// Inventario inicial por tienda (primer tramo — ver plan-history):
// captura centralizada de Finanzas del conteo físico de cada producto del
// catálogo de Odoo. A diferencia del resto del dashboard no existe "todas
// las tiendas" con sentido acá — el StoreSelect oculta esa opción y se
// autoselecciona la primera tienda activa. El catálogo carga automático
// al elegir tienda (como el resto del dashboard).
export function InventoryView() {
  const { data: stores, isLoading: storesLoading } = useStores();
  // Vendedor: solo lectura y forzado a su propia tienda (ver InventoryTable
  // readOnly + StoreSelect lockedToSingleStore); Admin/Finanzas capturan.
  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(defaultPosConfigId);

  // Autoselección de la primera tienda (Admin/Finanzas; el Vendedor ya
  // arranca en la suya) — ajuste de estado durante el render (mismo
  // criterio que el resto del proyecto), no un useEffect.
  if (posConfigId === undefined && !isVendedor && stores && stores.length > 0) {
    setPosConfigId(stores[0].id);
  }

  const inventory = useInventoryItems(posConfigId);
  const items = inventory.data ?? [];
  const selectedStore = stores?.find((store) => store.id === posConfigId);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        icon={Warehouse}
        title="Conteo"
        description={isVendedor ? "Existencia de tu tienda, solo lectura." : "Captura el conteo físico de cada tienda."}
      >
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={setPosConfigId}
          hideAllStoresOption
          lockedToSingleStore={isVendedor}
          tourId="inv-store"
        />
        <ExportExcelButton
          tourId="inv-export"
          filename={`inventario${selectedStore ? `-${selectedStore.name}` : ""}`}
          disabled={inventory.isLoading || items.length === 0}
          sheets={() => [
            {
              name: "Inventario",
              rows: items.map((item) => ({
                Producto: item.productName,
                Unidad: item.unit === "kg" ? "Kg" : "Unidad",
                "Existencia estimada": item.estimatedQuantity ?? "",
                "Inventario nuevo": item.quantity ?? "Sin contar",
                "Última modificación": item.updatedAt ?? "",
                "Modificado por": item.updatedByEmail ?? "",
              })),
            },
          ]}
        />
      </SectionCard>

      {posConfigId === undefined ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          {storesLoading ? "Cargando tiendas..." : "Selecciona una tienda para ver su inventario."}
        </div>
      ) : (
        <InventoryTable
          posConfigId={posConfigId}
          storeName={selectedStore?.name}
          items={items}
          isLoading={inventory.isLoading}
          isError={inventory.isError}
          errorMessage={inventory.error?.message}
          readOnly={isVendedor}
        />
      )}
    </div>
  );
}
