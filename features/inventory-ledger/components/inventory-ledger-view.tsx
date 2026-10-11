"use client";

import { useState } from "react";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { StoreSelect } from "@/components/filters/store-select";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { InventoryLedger } from "./inventory-ledger";

// Registro de entradas y salidas por tienda (ver plan-history
// 2026-10-11-registro-entradas-salidas): pantalla propia dentro del
// submenú Inventario. Igual que Conteo, no existe "todas las tiendas" con
// sentido acá — se oculta esa opción y se autoselecciona la primera. El
// selector de tienda va dentro de la misma card que los demás filtros
// (ver InventoryLedger `leading`).
export function InventoryLedgerView() {
  const { data: stores, isLoading: storesLoading } = useStores();
  // Vendedor: solo ve el Registro de su propia tienda.
  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(defaultPosConfigId);

  if (posConfigId === undefined && !isVendedor && stores && stores.length > 0) {
    setPosConfigId(stores[0].id);
  }

  const selectedStore = stores?.find((store) => store.id === posConfigId);

  const storeSelect = (
    <StoreSelect
      stores={stores}
      isLoading={storesLoading}
      value={posConfigId}
      onChange={setPosConfigId}
      hideAllStoresOption
      lockedToSingleStore={isVendedor}
    />
  );

  if (posConfigId === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <FilterToolbar description="Registro de entradas y salidas por tienda — ventas, movimientos y conteos con fecha y hora.">
          {storeSelect}
        </FilterToolbar>
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          {storesLoading ? "Cargando tiendas..." : "Selecciona una tienda para ver su registro."}
        </div>
      </div>
    );
  }

  return <InventoryLedger posConfigId={posConfigId} storeName={selectedStore?.name} leading={storeSelect} />;
}
