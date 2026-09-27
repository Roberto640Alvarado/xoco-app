"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { StoreSelect } from "@/components/filters/store-select";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { Button } from "@/components/ui/button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useInventoryItems } from "../hooks/use-inventory-items";
import { InventoryTable } from "./inventory-table";

// Inventario inicial por tienda (primer tramo — ver plan-history):
// captura centralizada de Finanzas del conteo físico de cada producto del
// catálogo de Odoo. A diferencia del resto del dashboard: (1) no existe
// "todas las tiendas" con sentido acá — el StoreSelect oculta esa opción
// y se autoselecciona la primera tienda activa; (2) la carga del catálogo
// NO es automática al elegir tienda — Finanzas la trae a propósito con el
// botón "Traer inventario" (pedido explícito del usuario), y cambiar de
// tienda vuelve a pedir ese clic.
export function InventoryView() {
  const { data: stores, isLoading: storesLoading } = useStores();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(undefined);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Autoselección de la primera tienda — ajuste de estado durante el
  // render (mismo criterio que el resto del proyecto), no un useEffect.
  if (posConfigId === undefined && stores && stores.length > 0) {
    setPosConfigId(stores[0].id);
  }

  // Cambiar de tienda invalida lo ya traído — hay que volver a presionar
  // "Traer inventario" para la nueva.
  const [lastPosConfigId, setLastPosConfigId] = useState<number | undefined>(undefined);
  if (posConfigId !== lastPosConfigId) {
    setLastPosConfigId(posConfigId);
    setShouldFetch(false);
  }

  const inventory = useInventoryItems(posConfigId, shouldFetch);
  const items = inventory.data ?? [];
  const selectedStore = stores?.find((store) => store.id === posConfigId);

  function handleFetchClick() {
    if (shouldFetch) {
      inventory.refetch();
    } else {
      setShouldFetch(true);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FilterToolbar description="Inventario inicial por tienda — trae el catálogo y captura el conteo físico de cada producto.">
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={setPosConfigId}
          hideAllStoresOption
        />
        <Button type="button" variant="outline" onClick={handleFetchClick} disabled={posConfigId == null || inventory.isFetching}>
          {inventory.isFetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Trayendo...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" aria-hidden="true" />
              {shouldFetch ? "Actualizar inventario" : "Traer inventario"}
            </>
          )}
        </Button>
        <ExportExcelButton
          filename={`inventario${selectedStore ? `-${selectedStore.name}` : ""}`}
          disabled={!shouldFetch || inventory.isLoading || items.length === 0}
          sheets={() => [
            {
              name: "Inventario",
              rows: items.map((item) => ({
                Producto: item.productName,
                Unidad: item.unit === "kg" ? "Kg" : "Unidad",
                Cantidad: item.quantity ?? "Sin contar",
                "Última modificación": item.updatedAt ?? "",
                "Modificado por": item.updatedByEmail ?? "",
              })),
            },
          ]}
        />
      </FilterToolbar>

      {!shouldFetch ? (
        <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 text-center text-sm text-muted-foreground">
          <p>{storesLoading ? "Cargando tiendas..." : "Elige la tienda y presiona \"Traer inventario\" para ver su catálogo."}</p>
        </div>
      ) : (
        <InventoryTable
          posConfigId={posConfigId as number}
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
