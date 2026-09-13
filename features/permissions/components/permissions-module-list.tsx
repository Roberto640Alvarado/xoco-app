"use client";

import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePermissionsMatrix } from "../hooks/use-permissions-matrix";
import { useSetRoleModuleAccess } from "../hooks/use-set-role-module-access";
import { MODULE_GROUPS, MODULE_ICON } from "../constants/module-groups";
import { MODULE_LABEL, SHARED_MODULE_GROUPS, getSharedPeers, type ModuleKey, type RoleModuleAccessRow } from "../types/permissions.types";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { ApiError } from "@/lib/api/client";

interface PermissionsModuleListProps {
  role: UserRole;
}

interface ToggleTarget {
  moduleKey: ModuleKey;
  nextEnabled: boolean;
}

const SHARED_SET = new Set<ModuleKey>(SHARED_MODULE_GROUPS.flat());

function sharedPeerLabels(moduleKey: ModuleKey): string {
  return getSharedPeers(moduleKey)
    .map((key) => MODULE_LABEL[key])
    .join(", ");
}

// Lista de módulos configurables para el rol elegido, agrupada EXACTAMENTE
// como el sidebar real (mismos grupos e íconos que NAV_ITEMS en
// app/dashboard/layout.tsx) — para que quede claro de un vistazo a qué
// pantalla del dashboard corresponde cada switch, en vez de una lista
// plana de texto. Switch + ConfirmDialog es el mismo patrón ya probado en
// features/users/components/users-table.tsx. Solo se muestran los
// módulos que el backend devuelve para ese rol (nunca aparece, ej.,
// "Ventas mayoreo" en la pestaña de Vendedor — esa combinación nunca
// estuvo en su techo de @Roles()).
export function PermissionsModuleList({ role }: PermissionsModuleListProps) {
  const matrix = usePermissionsMatrix();
  const setAccess = useSetRoleModuleAccess();
  const [confirmTarget, setConfirmTarget] = useState<ToggleTarget | null>(null);

  const rowByModuleKey = useMemo(() => {
    const map = new Map<ModuleKey, RoleModuleAccessRow>();
    for (const row of matrix.data ?? []) {
      if (row.role === role) map.set(row.moduleKey, row);
    }
    return map;
  }, [matrix.data, role]);

  const groups = useMemo(
    () =>
      MODULE_GROUPS.map((group) => ({
        label: group.label,
        rows: group.moduleKeys
          .map((moduleKey) => rowByModuleKey.get(moduleKey))
          .filter((row): row is RoleModuleAccessRow => row !== undefined),
      })).filter((group) => group.rows.length > 0),
    [rowByModuleKey],
  );

  const hasSharedModule = groups.some((group) => group.rows.some((row) => SHARED_SET.has(row.moduleKey)));

  const errorMessage = (setAccess.error as ApiError | null)?.message;
  const confirmErrorMessage =
    confirmTarget && setAccess.isError && setAccess.variables?.moduleKey === confirmTarget.moduleKey
      ? errorMessage
      : null;
  const confirmTargetIsShared = confirmTarget ? SHARED_SET.has(confirmTarget.moduleKey) : false;

  function handleConfirm() {
    if (!confirmTarget) return;
    setAccess.mutate(
      { role, moduleKey: confirmTarget.moduleKey, enabled: confirmTarget.nextEnabled },
      { onSuccess: () => setConfirmTarget(null) },
    );
  }

  if (matrix.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando módulos...</p>;
  }

  if (matrix.isError) {
    return <p className="text-sm text-destructive">No se pudo cargar la lista de módulos.</p>;
  }

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Este rol no tiene módulos configurables.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {hasSharedModule && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p>
            Los módulos marcados con <Link2 className="inline h-3 w-3 -translate-y-px" aria-hidden="true" />{" "}
            comparten el mismo dato en el servidor con otras pantallas — apagar uno solo oculta esa pantalla,
            pero el dato solo queda bloqueado de verdad si todas sus pantallas compañeras también están apagadas.
            Pasa el mouse sobre el ícono de cada uno para ver cuáles.
          </p>
        </div>
      )}

      {errorMessage && !confirmTarget && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.label} className="rounded-xl border border-border bg-card">
            <p className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <ul className="divide-y divide-border">
              {group.rows.map((row) => {
                const Icon = MODULE_ICON[row.moduleKey];
                const isShared = SHARED_SET.has(row.moduleKey);
                const isTogglingThisRow = setAccess.isPending && setAccess.variables?.moduleKey === row.moduleKey;

                return (
                  <li key={row.moduleKey} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-foreground">{MODULE_LABEL[row.moduleKey]}</p>
                          {isShared && (
                            <Tooltip>
                              <TooltipTrigger className="inline-flex text-muted-foreground/70 hover:text-muted-foreground">
                                <Link2 className="h-3 w-3" aria-hidden="true" />
                                <span className="sr-only">Comparte datos con otras pantallas</span>
                              </TooltipTrigger>
                              <TooltipContent>Comparte datos con: {sharedPeerLabels(row.moduleKey)}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {row.updatedByEmail && (
                          <p className="truncate text-xs text-muted-foreground">Últ. cambio: {row.updatedByEmail}</p>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={row.enabled}
                      disabled={isTogglingThisRow}
                      onCheckedChange={(checked) => setConfirmTarget({ moduleKey: row.moduleKey, nextEnabled: checked })}
                      aria-label={
                        row.enabled
                          ? `Apagar ${MODULE_LABEL[row.moduleKey]} para este rol`
                          : `Encender ${MODULE_LABEL[row.moduleKey]} para este rol`
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={
          confirmTarget
            ? confirmTarget.nextEnabled
              ? `¿Habilitar "${MODULE_LABEL[confirmTarget.moduleKey]}"?`
              : `¿Apagar "${MODULE_LABEL[confirmTarget.moduleKey]}"?`
            : ""
        }
        description={
          confirmTarget?.nextEnabled
            ? "Los usuarios con este rol podrán volver a verlo de inmediato."
            : confirmTargetIsShared
              ? `Los usuarios con este rol dejarán de ver esta pantalla. Como comparte datos con ${confirmTarget ? sharedPeerLabels(confirmTarget.moduleKey) : ""}, el dato solo queda bloqueado en el servidor si esas pantallas compañeras también quedan apagadas.`
              : "Los usuarios con este rol dejarán de ver este módulo, y su API empezará a rechazar sus peticiones."
        }
        confirmLabel={confirmTarget?.nextEnabled ? "Habilitar" : "Apagar"}
        variant={confirmTarget?.nextEnabled ? "default" : "destructive"}
        isLoading={setAccess.isPending}
        errorMessage={confirmErrorMessage}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
