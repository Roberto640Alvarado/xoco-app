"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { InDevelopmentBanner } from "@/components/ui/in-development-banner";
import { StoreSelect } from "@/components/filters/store-select";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { Button } from "@/components/ui/button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useInventoryItems } from "../hooks/use-inventory-items";
import { InventoryTable } from "./inventory-table";

// Inventario inicial por tienda (primer tramo — ver plan-history):
// captura centralizada de Finanzas del conteo físico de cada producto del
// catálogo de Odoo. A diferencia del resto del dashboard no existe "todas
// las tiendas" con sentido acá — el StoreSelect oculta esa opción y se
// autoselecciona la primera tienda activa. El catálogo carga automático
// al elegir tienda (como el resto del dashboard); "Actualizar inventario"
// es un refetch manual, no un gate de la carga inicial.
export function InventoryView() {
  const { data: stores, isLoading: storesLoading } = useStores();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(undefined);

  // Autoselección de la primera tienda — ajuste de estado durante el
  // render (mismo criterio que el resto del proyecto), no un useEffect.
  if (posConfigId === undefined && stores && stores.length > 0) {
    setPosConfigId(stores[0].id);
  }

  const inventory = useInventoryItems(posConfigId);
  const items = inventory.data ?? [];
  const selectedStore = stores?.find((store) => store.id === posConfigId);

  return (
    <div className="flex flex-col gap-4">
      <InDevelopmentBanner message="Inventario está en desarrollo — la existencia estimada se corrige cada vez que Finanzas guarda un nuevo conteo físico." />
      <FilterToolbar description="Inventario por tienda — conteo físico de cada producto y su existencia estimada desde ese conteo.">
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={setPosConfigId}
          hideAllStoresOption
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inventory.refetch()}
          disabled={posConfigId == null || inventory.isFetching}
        >
          {inventory.isFetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Actualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Actualizar inventario
            </>
          )}
        </Button>
        <ExportExcelButton
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
      </FilterToolbar>

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
        />
      )}
    </div>
  );
}
