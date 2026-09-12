"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePermissionsMatrix } from "../hooks/use-permissions-matrix";
import { useSetRoleModuleAccess } from "../hooks/use-set-role-module-access";
import { MODULE_LABEL, SHARED_DAILY_SUMMARY_MODULE_KEYS, type ModuleKey } from "../types/permissions.types";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { ApiError } from "@/lib/api/client";

interface PermissionsModuleListProps {
  role: UserRole;
}

interface ToggleTarget {
  moduleKey: ModuleKey;
  nextEnabled: boolean;
}

// Lista de módulos configurables para el rol elegido, con un Switch por
// fila + ConfirmDialog — mismo patrón ya probado en
// features/users/components/users-table.tsx para activar/desactivar una
// cuenta. Solo se muestran los módulos que el backend devuelve para ese
// rol (nunca aparece, ej., "Ventas mayoreo" en la pestaña de Vendedor —
// esa combinación nunca estuvo en su techo de @Roles()).
export function PermissionsModuleList({ role }: PermissionsModuleListProps) {
  const matrix = usePermissionsMatrix();
  const setAccess = useSetRoleModuleAccess();
  const [confirmTarget, setConfirmTarget] = useState<ToggleTarget | null>(null);

  const rows = useMemo(
    () => (matrix.data ?? []).filter((row) => row.role === role),
    [matrix.data, role],
  );

  const errorMessage = (setAccess.error as ApiError | null)?.message;
  const confirmErrorMessage =
    confirmTarget && setAccess.isError && setAccess.variables?.moduleKey === confirmTarget.moduleKey
      ? errorMessage
      : null;

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

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Este rol no tiene módulos configurables.</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {errorMessage && !confirmTarget && (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const isShared = SHARED_DAILY_SUMMARY_MODULE_KEYS.includes(row.moduleKey);
          const isTogglingThisRow = setAccess.isPending && setAccess.variables?.moduleKey === row.moduleKey;

          return (
            <li key={row.moduleKey} className="flex items-start justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{MODULE_LABEL[row.moduleKey]}</p>
                {isShared && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    Comparte datos con Resumen, Visitas, Tráfico diario, Venta diaria y Ticket detallado —
                    apagar solo este oculta la pantalla, pero el dato solo queda bloqueado en el servidor si
                    los 5 están apagados.
                  </p>
                )}
                {row.updatedByEmail && (
                  <p className="mt-1 text-xs text-muted-foreground">Últ. cambio: {row.updatedByEmail}</p>
                )}
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
