"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PackageMinus, Plus, Store as StoreIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { StoreSelect } from "@/components/filters/store-select";
import { Button } from "@/components/ui/button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { useAuthStore } from "@/store/auth-store";
import { useInventoryMovements } from "../hooks/use-inventory-movements";
import { useMovementsInbox } from "../hooks/use-movements-inbox";
import { markSeen } from "../lib/last-seen";
import { CreateMovementDialog } from "./create-movement-dialog";
import { MovementsTable } from "./movements-table";

// Merma, regalías y degustaciones (salidas). Las solicitudes de stock
// (entradas) viven en su propia pantalla — ver InventoryRequestsView.
// Mismo criterio de scoping por tienda que el resto del dashboard
// (useVendedorStoreFilter + StoreSelect lockedToSingleStore): el Vendedor
// entra forzado a su propia tienda y no puede confirmar/rechazar lo que él
// mismo reporta (canResolve = false). Admin/Finanzas, además de ver una
// tienda a la vez, pueden pasar a "Pendientes de todas las tiendas".
export function InventoryMovementsView() {
  const user = useAuthStore((state) => state.user);
  const canResolve = user?.role === "SUPER_ADMIN" || user?.role === "FINANZAS";
  const queryClient = useQueryClient();

  // Al abrir la pantalla, lo resuelto ya se ve en la tabla: se marca como
  // visto y se recalcula el aviso del menú (ver useMovementNotifications).
  const userEmail = user?.email;
  useEffect(() => {
    if (!userEmail) return;
    markSeen(userEmail, "movements");
    queryClient.invalidateQueries({ queryKey: ["inventory", "notifications"] });
  }, [userEmail, queryClient]);

  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const { data: stores, isLoading: storesLoading } = useStores();
  const [posConfigId, setPosConfigId] = useState<number | undefined>(defaultPosConfigId);
  const [createOpen, setCreateOpen] = useState(false);
  const [allStoresPending, setAllStoresPending] = useState(false);

  // Autoselección de la primera tienda para Admin/Finanzas (Vendedor ya
  // arranca en la suya vía defaultPosConfigId) — ajuste de estado durante el
  // render, no un useEffect.
  if (posConfigId === undefined && !isVendedor && stores && stores.length > 0) {
    setPosConfigId(stores[0].id);
  }

  const movements = useInventoryMovements(allStoresPending ? undefined : posConfigId);
  const inbox = useMovementsInbox("movements", canResolve && allStoresPending);
  const selectedStore = stores?.find((store) => store.id === posConfigId);
  const storeNames = useMemo(() => new Map((stores ?? []).map((store) => [store.id, store.name])), [stores]);

  const source = allStoresPending ? inbox : movements;
  const rows = useMemo(
    () => (source.data ?? []).filter((movement) => movement.type !== "ENTRADA"),
    [source.data],
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        icon={PackageMinus}
        title="Movimientos"
        description={isVendedor ? "Reporta mermas, regalías y degustaciones." : "Mermas, regalías y degustaciones."}
      >
        {!allStoresPending && (
          <StoreSelect
            stores={stores}
            isLoading={storesLoading}
            value={posConfigId}
            onChange={setPosConfigId}
            hideAllStoresOption
            lockedToSingleStore={isVendedor}
            tourId="mov-store"
          />
        )}
        {canResolve && (
          <Button
            type="button"
            data-tour="mov-pending"
            variant={allStoresPending ? "default" : "outline"}
            onClick={() => setAllStoresPending((current) => !current)}
          >
            <StoreIcon className="h-4 w-4" aria-hidden="true" />
            Pendientes de todas las tiendas
          </Button>
        )}
        <Button type="button" data-tour="mov-new" onClick={() => setCreateOpen(true)} disabled={posConfigId == null || allStoresPending}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Registrar movimiento
        </Button>
      </SectionCard>

      {!allStoresPending && posConfigId === undefined ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          {storesLoading ? "Cargando tiendas..." : "Selecciona una tienda para ver sus movimientos."}
        </div>
      ) : (
        <MovementsTable
          movements={rows}
          isLoading={source.isLoading}
          isError={source.isError}
          errorMessage={source.error?.message}
          canResolve={canResolve}
          storeNames={allStoresPending ? storeNames : undefined}
          emptyMessage={
            allStoresPending ? "No hay mermas, regalías ni degustaciones pendientes." : "Todavía no hay movimientos registrados."
          }
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
