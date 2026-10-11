"use client";

import { useState } from "react";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { StoreSelect } from "@/components/filters/store-select";
import { useStores } from "@/features/sales/hooks/use-stores";
import { InventoryLedger } from "./inventory-ledger";

// Registro de entradas y salidas por tienda (ver plan-history
// 2026-10-11-registro-entradas-salidas): pantalla propia dentro del
// submenú Inventario. Igual que Conteo, no existe "todas las tiendas" con
// sentido acá — se oculta esa opción y se autoselecciona la primera.
export function InventoryLedgerView() {
  const { data: stores, isLoading: storesLoading } = useStores();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(undefined);

  if (posConfigId === undefined && stores && stores.length > 0) {
    setPosConfigId(stores[0].id);
  }

  const selectedStore = stores?.find((store) => store.id === posConfigId);

  return (
    <div className="flex flex-col gap-4">
      <FilterToolbar description="Registro de entradas y salidas por tienda — ventas, movimientos y conteos con fecha y hora.">
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={setPosConfigId}
          hideAllStoresOption
        />
      </FilterToolbar>

      {posConfigId === undefined ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          {storesLoading ? "Cargando tiendas..." : "Selecciona una tienda para ver su registro."}
        </div>
      ) : (
        <InventoryLedger posConfigId={posConfigId} storeName={selectedStore?.name} />
      )}
    </div>
  );
}
