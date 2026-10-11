"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { DateRangeFilter, type DateRangeValue } from "@/components/filters/date-range-filter";
import { SectionCard } from "@/design-system/components/section-card";
import { StoreSelect } from "@/components/filters/store-select";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayIsoDate } from "@/lib/format";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import { useAuthStore } from "@/store/auth-store";
import { useInventoryMovements } from "../hooks/use-inventory-movements";
import { useMovementsInbox } from "../hooks/use-movements-inbox";
import { markSeen } from "../lib/last-seen";
import type { InventoryMovement, InventoryMovementStatus } from "../types/inventory-movement.types";
import { MovementsTable } from "./movements-table";
import { RequestStockDialog } from "./request-stock-dialog";

const ALL = "all";

const STATUS_LABEL: Record<InventoryMovementStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_CAMINO: "En camino",
  RECIBIDO: "Recibido",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
};

// La bandeja de Admin/Finanzas solo trae lo abierto; el Vendedor ve también
// lo que ya se confirmó o rechazó.
const OPEN_STATUSES: InventoryMovementStatus[] = ["PENDIENTE", "EN_CAMINO", "RECIBIDO"];
const ALL_STATUSES = Object.keys(STATUS_LABEL) as InventoryMovementStatus[];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

// Fecha LOCAL (YYYY-MM-DD) de un instante ISO, para compararla con el rango.
function localIsoDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// Por defecto, lo que va del año: una solicitud abierta no se esconde por
// antigua, pero el rango se puede acotar.
function defaultRange(): DateRangeValue {
  return { dateFrom: `${new Date().getFullYear()}-01-01`, dateTo: todayIsoDate() };
}

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
  const { data: stores, isLoading: storesLoading } = useStores();
  const storeNames = useMemo(() => new Map((stores ?? []).map((store) => [store.id, store.name])), [stores]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [range, setRange] = useState<DateRangeValue>(defaultRange);
  const [storeFilter, setStoreFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<InventoryMovementStatus | undefined>(undefined);

  // Admin/Finanzas: bandeja de todas las tiendas.
  const inbox = useMovementsInbox("requests", isAdminOrFinanzas);
  // Vendedor: sus solicitudes (el listado de movimientos de su tienda,
  // filtrado a ENTRADA).
  const ownMovements = useInventoryMovements(isVendedor ? defaultPosConfigId : undefined);
  const ownRequests = useMemo(
    () => (ownMovements.data ?? []).filter((movement) => movement.type === "ENTRADA"),
    [ownMovements.data],
  );

  const applyFilters = (rows: InventoryMovement[]) =>
    rows.filter((movement) => {
      const day = localIsoDate(movement.occurredAt);
      if (day < range.dateFrom || day > range.dateTo) return false;
      if (storeFilter !== undefined && movement.posConfigId !== storeFilter) return false;
      if (statusFilter !== undefined && movement.status !== statusFilter) return false;
      return true;
    });
  const adminRows = useMemo(
    () => applyFilters(inbox.data ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inbox.data, range, storeFilter, statusFilter],
  );
  const vendedorRows = useMemo(
    () => applyFilters(ownRequests),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ownRequests, range, statusFilter],
  );
  const statusOptions = isVendedor ? ALL_STATUSES : OPEN_STATUSES;

  const ownStoreName = defaultPosConfigId != null ? storeNames.get(defaultPosConfigId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        icon={PackagePlus}
        title="Solicitudes"
        description={isVendedor ? "Pide stock y sigue tus solicitudes." : "Solicitudes de stock de todas las tiendas."}
        tourId="req-filters"
      >
        <DateRangeFilter value={range} onChange={setRange} maxDate={todayIsoDate()} />
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={isVendedor ? defaultPosConfigId : storeFilter}
          onChange={setStoreFilter}
          lockedToSingleStore={isVendedor}
        />
        <Select
          value={statusFilter ?? ALL}
          onValueChange={(next) => setStatusFilter(next === ALL ? undefined : (next as InventoryMovementStatus))}
        >
          <SelectTrigger aria-label="Filtrar por estado" className="w-full gap-2 sm:w-[170px]">
            <SelectValue>
              {(raw: string) => (raw === ALL ? "Todos los estados" : STATUS_LABEL[raw as InventoryMovementStatus])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isVendedor && (
          <Button type="button" data-tour="req-new" onClick={() => setRequestOpen(true)} disabled={defaultPosConfigId == null}>
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Solicitar stock
          </Button>
        )}
      </SectionCard>

      {isVendedor ? (
        <MovementsTable
          movements={vendedorRows}
          isLoading={ownMovements.isLoading}
          isError={ownMovements.isError}
          errorMessage={ownMovements.error?.message}
          canResolve={false}
          emptyMessage={
            ownRequests.length === 0 ? "Todavía no has hecho solicitudes de stock." : "Ninguna solicitud coincide con los filtros."
          }
          statusInfo="estados-solicitud"
          columnFilters={false}
        />
      ) : (
        <MovementsTable
          movements={adminRows}
          isLoading={inbox.isLoading}
          isError={inbox.isError}
          errorMessage={inbox.error?.message}
          canResolve={isAdminOrFinanzas}
          storeNames={storeNames}
          emptyMessage={
            (inbox.data ?? []).length === 0 ? "No hay solicitudes de stock abiertas." : "Ninguna solicitud coincide con los filtros."
          }
          statusInfo="estados-solicitud"
          columnFilters={false}
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
