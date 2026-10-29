"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, EyeOff, Info, Store as StoreIcon, Warehouse } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { NoticeCard } from "@/design-system/components/notice-card";
import { Panel } from "@/design-system/components/panel";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useInventoryAccess } from "../hooks/use-inventory-access";
import { useSetAllInventoryAccess } from "../hooks/use-set-all-inventory-access";
import { useSetInventoryAccess } from "../hooks/use-set-inventory-access";
import type { ApiError } from "@/lib/api/client";

interface PendingToggle {
  posConfigId: number;
  storeName: string;
  nextEnabled: boolean;
}

// Administración → Inventario: el Super admin habilita (o vuelve a ocultar)
// el módulo de Inventario para los Vendedores, tienda por tienda. Mientras
// una tienda no esté habilitada, sus Vendedores no ven la sección; Admin y
// Finanzas la usan siempre para cargar primero el stock manual.
export function InventoryAccessPanel() {
  const { data: stores, isLoading: storesLoading, isError: storesError, error: storesErrorValue } = useStores();
  const { data: access, isLoading: accessLoading } = useInventoryAccess();
  const setAccess = useSetInventoryAccess();
  const setAll = useSetAllInventoryAccess();
  const [pending, setPending] = useState<PendingToggle | null>(null);
  // Acción masiva pendiente de confirmar: true = habilitar todas, false = ocultar todas.
  const [bulkNext, setBulkNext] = useState<boolean | null>(null);

  const enabledIds = new Set(access?.enabledPosConfigIds ?? []);
  const isLoading = storesLoading || accessLoading;

  const allStores = stores ?? [];
  const enabledCount = allStores.filter((store) => enabledIds.has(store.id)).length;
  const allEnabled = allStores.length > 0 && enabledCount === allStores.length;
  const noneEnabled = enabledCount === 0;

  function handleConfirmBulk() {
    if (bulkNext === null) return;
    // Solo las tiendas que cambian de estado.
    const posConfigIds = allStores.filter((store) => enabledIds.has(store.id) !== bulkNext).map((store) => store.id);
    setAll.mutate({ posConfigIds, enabled: bulkNext }, { onSuccess: () => setBulkNext(null) });
  }

  function handleConfirm() {
    if (!pending) return;
    setAccess.mutate(
      { posConfigId: pending.posConfigId, enabled: pending.nextEnabled },
      { onSuccess: () => setPending(null) },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <NoticeCard
        role="note"
        tourId="access-note"
        icon={Info}
        title="Carga el stock primero"
        description="Habilita una tienda solo después de contarla. Ocultarla no borra nada. Además, cada Vendedor necesita su propio acceso (Usuarios → Editar)."
        action={
          <Link href="/dashboard/inventario" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Warehouse className="size-4" aria-hidden="true" />
            Ir a Conteo
          </Link>
        }
      />

      {storesError ? (
        <ChartErrorState message={storesErrorValue?.message} />
      ) : (
        <Panel flush tourId="access-list" icon={StoreIcon} title="Tiendas" description="Activa el interruptor para mostrar Inventario a sus Vendedores."
          action={
            <div className="flex flex-wrap items-center gap-2" data-tour="access-bulk">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || allEnabled}
                onClick={() => {
                  setAll.reset();
                  setBulkNext(true);
                }}
              >
                <Check aria-hidden="true" />
                Habilitar todas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || noneEnabled}
                onClick={() => {
                  setAll.reset();
                  setBulkNext(false);
                }}
              >
                <EyeOff aria-hidden="true" />
                Ocultar todas
              </Button>
            </div>
          }
        >
          {isLoading ? (
            <div className="flex flex-col gap-2 p-5" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(stores ?? []).map((store, storeIndex) => {
                const enabled = enabledIds.has(store.id);
                const isToggling = setAccess.isPending && setAccess.variables?.posConfigId === store.id;
                return (
                  <li key={store.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <StoreIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{store.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {enabled ? "Visible para los Vendedores de la tienda" : "Oculto para los Vendedores"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      data-tour={storeIndex === 0 ? "access-switch" : undefined}
                      checked={enabled}
                      disabled={isToggling}
                      onCheckedChange={(checked) =>
                        setPending({ posConfigId: store.id, storeName: store.name, nextEnabled: checked })
                      }
                      aria-label={`${enabled ? "Ocultar" : "Habilitar"} Inventario en ${store.name}`}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      <ConfirmDialog
        open={bulkNext !== null}
        onOpenChange={(open) => !open && setBulkNext(null)}
        title={bulkNext ? "¿Habilitar Inventario en todas las tiendas?" : "¿Ocultar Inventario en todas las tiendas?"}
        description={
          bulkNext
            ? "Los Vendedores de todas las tiendas verán Inventario. Asegúrate de haber cargado primero el stock de cada una en Conteo."
            : "Los Vendedores de todas las tiendas dejarán de ver Inventario. No se borra ningún dato y Admin y Finanzas siguen viéndolo."
        }
        confirmLabel={bulkNext ? "Habilitar todas" : "Ocultar todas"}
        variant={bulkNext ? "default" : "destructive"}
        onConfirm={handleConfirmBulk}
        isLoading={setAll.isPending}
        errorMessage={setAll.error?.message}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.nextEnabled ? `¿Habilitar Inventario en ${pending.storeName}?` : `¿Ocultar Inventario en ${pending?.storeName}?`}
        description={
          pending?.nextEnabled
            ? "Los Vendedores de esta tienda verán el stock (solo lectura), el Registro y podrán solicitar stock y reportar movimientos. Asegúrate de haber cargado primero el stock de la tienda en Conteo."
            : "Los Vendedores de esta tienda dejarán de ver Inventario. No se borra ningún dato y Admin/Finanzas siguen viéndolo."
        }
        confirmLabel={pending?.nextEnabled ? "Habilitar" : "Ocultar"}
        variant={pending?.nextEnabled ? "default" : "destructive"}
        onConfirm={handleConfirm}
        isLoading={setAccess.isPending}
        errorMessage={(setAccess.error as ApiError | null)?.message}
      />
    </div>
  );
}
