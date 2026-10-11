"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { StoreSelect } from "@/components/filters/store-select";
import { Button } from "@/components/ui/button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { useAuthStore } from "@/store/auth-store";
import { useInventoryMovements } from "../hooks/use-inventory-movements";
import { CreateMovementDialog } from "./create-movement-dialog";
import { MovementsTable } from "./movements-table";

// Segundo tramo de Inventario (ver plan-history): merma, regalías y
// degustaciones. Mismo criterio de scoping por tienda que el resto del
// dashboard (useVendedorStoreFilter + StoreSelect lockedToSingleStore)
// — a diferencia de InventoryView (conteo físico, solo Admin/Finanzas),
// acá SÍ entra Vendedor, pero forzado a su propia tienda y sin poder
// confirmar/rechazar lo que él mismo reporta (canResolve = false para
// Vendedor, ver MovementsTable).
export function InventoryMovementsView() {
  const user = useAuthStore((state) => state.user);
  const canResolve = user?.role === "SUPER_ADMIN" || user?.role === "FINANZAS";

  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const { data: stores, isLoading: storesLoading } = useStores();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(defaultPosConfigId);
  const [createOpen, setCreateOpen] = useState(false);

  // Autoselección de la primera tienda para Admin/Finanzas (Vendedor ya
  // arranca en la suya vía defaultPosConfigId) — mismo criterio que
  // InventoryView: ajuste de estado durante el render, no un useEffect.
  if (posConfigId === undefined && !isVendedor && stores && stores.length > 0) {
    setPosConfigId(stores[0].id);
  }

  const movements = useInventoryMovements(posConfigId);
  const selectedStore = stores?.find((store) => store.id === posConfigId);

  return (
    <div className="flex flex-col gap-4">
      <FilterToolbar
        description={
          isVendedor
            ? "Registra mermas, regalías o degustaciones de tu tienda — quedan pendientes hasta que Admin o Finanzas las confirme."
            : "Historial de mermas, regalías y degustaciones por tienda — lo pendiente viene de un Vendedor y hace falta confirmarlo o rechazarlo."
        }
      >
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={setPosConfigId}
          hideAllStoresOption
          lockedToSingleStore={isVendedor}
        />
        <Button type="button" onClick={() => setCreateOpen(true)} disabled={posConfigId == null}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Registrar movimiento
        </Button>
      </FilterToolbar>

      {posConfigId === undefined ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          {storesLoading ? "Cargando tiendas..." : "Selecciona una tienda para ver sus movimientos."}
        </div>
      ) : (
        <MovementsTable
          movements={movements.data ?? []}
          isLoading={movements.isLoading}
          isError={movements.isError}
          errorMessage={movements.error?.message}
          canResolve={canResolve}
        />
      )}

      {posConfigId != null && (
        <CreateMovementDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          posConfigId={posConfigId}
          storeName={selectedStore?.name}
          isVendedor={isVendedor}
        />
      )}
    </div>
  );
}
