"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { SectionCard } from "@/design-system/components/section-card";
import { StoreSelect } from "@/components/filters/store-select";
import { Button } from "@/components/ui/button";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { useAuthStore } from "@/store/auth-store";
import { useInventoryMovements } from "../hooks/use-inventory-movements";
import { useMovementsInbox } from "../hooks/use-movements-inbox";
import { markSeen } from "../lib/last-seen";
import { MovementsTable } from "./movements-table";
import { RequestStockDialog } from "./request-stock-dialog";

// Solicitudes de stock (entradas planta→tienda).
//
// - Vendedor: pide más stock de su tienda y sigue el estado de cada
//   solicitud (pendiente → en camino → recibida → confirmada, o rechazada
//   con motivo); cuando llega, la marca como recibida desde la tabla.
// - Admin/Finanzas: bandeja con lo abierto de TODAS las tiendas — aceptan
//   (en camino), rechazan con motivo o, ya recibida, confirman (recién ahí
//   se suma al stock). El envío en sí es un proceso manual de ellos.
export function InventoryRequestsView() {
  const user = useAuthStore((state) => state.user);
  const isAdminOrFinanzas = user?.role === "SUPER_ADMIN" || user?.role === "FINANZAS";
  const queryClient = useQueryClient();

  const userEmail = user?.email;
  useEffect(() => {
    if (!userEmail) return;
    markSeen(userEmail, "requests");
    queryClient.invalidateQueries({ queryKey: ["inventory", "notifications"] });
  }, [userEmail, queryClient]);

  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const { data: stores } = useStores();
  const storeNames = useMemo(() => new Map((stores ?? []).map((store) => [store.id, store.name])), [stores]);
  const [requestOpen, setRequestOpen] = useState(false);

  // Admin/Finanzas: bandeja de todas las tiendas.
  const inbox = useMovementsInbox("requests", isAdminOrFinanzas);
  // Vendedor: sus solicitudes (el listado de movimientos de su tienda,
  // filtrado a ENTRADA).
  const ownMovements = useInventoryMovements(isVendedor ? defaultPosConfigId : undefined);
  const ownRequests = useMemo(
    () => (ownMovements.data ?? []).filter((movement) => movement.type === "ENTRADA"),
    [ownMovements.data],
  );

  const ownStoreName = defaultPosConfigId != null ? storeNames.get(defaultPosConfigId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        icon={PackagePlus}
        title="Solicitudes"
        description={isVendedor ? "Pide stock y sigue tus solicitudes." : "Solicitudes de stock de todas las tiendas."}
      >
        {isVendedor && (
          <>
            <StoreSelect
              stores={stores}
              isLoading={false}
              value={defaultPosConfigId}
              onChange={() => undefined}
              hideAllStoresOption
              lockedToSingleStore
            />
            <Button type="button" data-tour="req-new" onClick={() => setRequestOpen(true)} disabled={defaultPosConfigId == null}>
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              Solicitar stock
            </Button>
          </>
        )}
      </SectionCard>

      {isVendedor ? (
        <MovementsTable
          movements={ownRequests}
          isLoading={ownMovements.isLoading}
          isError={ownMovements.isError}
          errorMessage={ownMovements.error?.message}
          canResolve={false}
          emptyMessage="Todavía no has hecho solicitudes de stock."
          statusInfo="estados-solicitud"
        />
      ) : (
        <MovementsTable
          movements={inbox.data ?? []}
          isLoading={inbox.isLoading}
          isError={inbox.isError}
          errorMessage={inbox.error?.message}
          canResolve={isAdminOrFinanzas}
          storeNames={storeNames}
          emptyMessage="No hay solicitudes de stock abiertas."
          statusInfo="estados-solicitud"
        />
      )}

      {isVendedor && defaultPosConfigId != null && (
        <RequestStockDialog
          open={requestOpen}
          onOpenChange={setRequestOpen}
          posConfigId={defaultPosConfigId}
          storeName={ownStoreName}
        />
      )}
    </div>
  );
}
