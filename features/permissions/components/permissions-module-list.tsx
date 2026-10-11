"use client";

import { useMemo, useRef, useState } from "react";
import { Link2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoBadge } from "@/design-system/components/info-badge";
import { Panel } from "@/design-system/components/panel";
import { usePermissionsMatrix } from "../hooks/use-permissions-matrix";
import { useSetRoleModuleAccess } from "../hooks/use-set-role-module-access";
import { MODULE_GROUPS, MODULE_ICON } from "../constants/module-groups";
import { MODULE_INFO } from "../constants/module-info";
import { MODULE_LABEL, SHARED_MODULE_GROUPS, getSharedPeers, type ModuleKey, type RoleModuleAccessRow } from "../types/permissions.types";
import { ModuleDetail, ROLE_NAME } from "./module-detail";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { ApiError } from "@/lib/api/client";

interface PermissionsModuleListProps {
  role: UserRole;
}

interface ToggleTarget {
  moduleKey: ModuleKey;
  nextEnabled: boolean;
}

type Filter = "all" | "enabled" | "disabled";

const SHARED_SET = new Set<ModuleKey>(SHARED_MODULE_GROUPS.flat());

function sharedPeerLabels(moduleKey: ModuleKey): string {
  return getSharedPeers(moduleKey)
    .map((key) => MODULE_LABEL[key])
    .join(", ");
}

// Permisos de un rol: resumen con filtro, lista de módulos agrupada como el
// menú real y, al lado, el detalle del módulo elegido con su vista previa.
// Elegir una fila no cambia nada; el interruptor (o el botón del detalle)
// pide confirmación y dice qué se da o se quita.
export function PermissionsModuleList({ role }: PermissionsModuleListProps) {
  const matrix = usePermissionsMatrix();
  const setAccess = useSetRoleModuleAccess();
  const [confirmTarget, setConfirmTarget] = useState<ToggleTarget | null>(null);
  const [selectedKey, setSelectedKey] = useState<ModuleKey | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const detailRef = useRef<HTMLDivElement>(null);

  const rowByModuleKey = useMemo(() => {
    const map = new Map<ModuleKey, RoleModuleAccessRow>();
    for (const row of matrix.data ?? []) {
      if (row.role === role) map.set(row.moduleKey, row);
    }
    return map;
  }, [matrix.data, role]);

  const rowsByRoleFor = useMemo(() => {
    const map = new Map<ModuleKey, Map<UserRole, RoleModuleAccessRow>>();
    for (const row of matrix.data ?? []) {
      const byRole = map.get(row.moduleKey) ?? new Map<UserRole, RoleModuleAccessRow>();
      byRole.set(row.role, row);
      map.set(row.moduleKey, byRole);
    }
    return map;
  }, [matrix.data]);

  const allRows = useMemo(() => Array.from(rowByModuleKey.values()), [rowByModuleKey]);
  const enabledCount = allRows.filter((row) => row.enabled).length;
  const total = allRows.length;

  const groups = useMemo(
    () =>
      MODULE_GROUPS.map((group) => ({
        label: group.label,
        total: group.moduleKeys.filter((key) => rowByModuleKey.has(key)).length,
        rows: group.moduleKeys
          .map((moduleKey) => rowByModuleKey.get(moduleKey))
          .filter((row): row is RoleModuleAccessRow => row !== undefined)
          .filter((row) => filter === "all" || (filter === "enabled" ? row.enabled : !row.enabled)),
      })).filter((group) => group.rows.length > 0),
    [rowByModuleKey, filter],
  );

  // Si el módulo elegido ya no está en este rol (cambio de rol) o no hay
  // ninguno elegido, se muestra el primero de la lista.
  const firstKey = groups[0]?.rows[0]?.moduleKey ?? null;
  const activeKey = selectedKey && rowByModuleKey.has(selectedKey) ? selectedKey : firstKey;
  const activeRow = activeKey ? rowByModuleKey.get(activeKey) : undefined;

  const roleName = ROLE_NAME[role];
  const errorMessage = (setAccess.error as ApiError | null)?.message;
  const confirmErrorMessage =
    confirmTarget && setAccess.isError && setAccess.variables?.moduleKey === confirmTarget.moduleKey ? errorMessage : null;
  const confirmTargetIsShared = confirmTarget ? SHARED_SET.has(confirmTarget.moduleKey) : false;

  function handleSelect(moduleKey: ModuleKey) {
    setSelectedKey(moduleKey);
    // En pantallas chicas el detalle queda arriba de la lista: se lleva la vista hasta él.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function askToggle(moduleKey: ModuleKey, nextEnabled: boolean) {
    setAccess.reset();
    setConfirmTarget({ moduleKey, nextEnabled });
  }

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

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Este rol no tiene módulos configurables.</p>;
  }

  const FILTERS: Array<{ id: Filter; label: string; count: number }> = [
    { id: "all", label: "Todos", count: total },
    { id: "enabled", label: "Con acceso", count: enabledCount },
    { id: "disabled", label: "Ocultos", count: total - enabledCount },
  ];

  const confirmLabel = confirmTarget ? MODULE_LABEL[confirmTarget.moduleKey] : "";
  const confirmGroup = confirmTarget ? MODULE_INFO[confirmTarget.moduleKey].group : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {roleName} ve {enabledCount} de {total} secciones
            </p>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={enabledCount}
              aria-label="Secciones con acceso"
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(enabledCount / total) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Elige una sección para ver su vista previa antes de cambiar el acceso.</p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar secciones">
            {FILTERS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant={filter === option.id ? "secondary" : "outline"}
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
              >
                {option.label} ({option.count})
              </Button>
            ))}
          </div>
        </div>
      </Panel>

      {errorMessage && !confirmTarget && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex flex-col gap-4" data-tour="perm-list">
          {groups.length === 0 ? (
            <Panel>
              <p className="text-sm text-muted-foreground">No hay secciones en este filtro.</p>
            </Panel>
          ) : (
            groups.map((group) => {
              const groupEnabled = group.rows.filter((row) => row.enabled).length;
              return (
                <Panel
                  key={group.label}
                  flush
                  title={group.label}
                  badge={
                    <InfoBadge tone="neutral" size="sm">
                      {groupEnabled} de {group.rows.length}
                    </InfoBadge>
                  }
                >
                  <ul className="divide-y divide-border">
                    {group.rows.map((row) => {
                      const Icon = MODULE_ICON[row.moduleKey];
                      const isShared = SHARED_SET.has(row.moduleKey);
                      const isSelected = row.moduleKey === activeKey;
                      const isTogglingThisRow = setAccess.isPending && setAccess.variables?.moduleKey === row.moduleKey;

                      return (
                        <li
                          key={row.moduleKey}
                          className={cn("flex items-center gap-2 pr-5 transition-colors", isSelected ? "bg-muted/60" : "hover:bg-muted/30")}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelect(row.moduleKey)}
                            aria-pressed={isSelected}
                            className={cn(
                              "flex min-w-0 flex-1 items-center gap-3 border-l-2 py-3 pl-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                              isSelected ? "border-primary" : "border-transparent",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                row.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={cn("truncate text-sm font-medium", row.enabled ? "text-foreground" : "text-muted-foreground")}
                                >
                                  {MODULE_LABEL[row.moduleKey]}
                                </span>
                                {isShared && (
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={<span />}
                                      className="inline-flex text-muted-foreground/70"
                                    >
                                      <Link2 className="size-3" aria-hidden="true" />
                                      <span className="sr-only">Comparte datos con otras pantallas</span>
                                    </TooltipTrigger>
                                    <TooltipContent>Comparte datos con: {sharedPeerLabels(row.moduleKey)}</TooltipContent>
                                  </Tooltip>
                                )}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">{MODULE_INFO[row.moduleKey].summary}</span>
                            </span>
                          </button>
                          <InfoBadge tone={row.enabled ? "success" : "neutral"} size="sm" dot className="hidden sm:inline-flex">
                            {row.enabled ? "Con acceso" : "Oculto"}
                          </InfoBadge>
                          <Switch
                            checked={row.enabled}
                            disabled={isTogglingThisRow}
                            onCheckedChange={(checked) => askToggle(row.moduleKey, checked)}
                            aria-label={
                              row.enabled
                                ? `Quitar ${MODULE_LABEL[row.moduleKey]} a ${roleName}`
                                : `Dar ${MODULE_LABEL[row.moduleKey]} a ${roleName}`
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              );
            })
          )}
        </div>

        <div ref={detailRef} className="order-first scroll-mt-4 lg:sticky lg:top-4 lg:order-none">
          {activeKey && activeRow && (
            <ModuleDetail
              moduleKey={activeKey}
              role={role}
              row={activeRow}
              rowsByRole={rowsByRoleFor.get(activeKey) ?? new Map()}
              isToggling={setAccess.isPending && setAccess.variables?.moduleKey === activeKey}
              onToggle={(next) => askToggle(activeKey, next)}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={
          confirmTarget
            ? confirmTarget.nextEnabled
              ? `¿Dar acceso a "${confirmLabel}" a ${roleName}?`
              : `¿Quitar "${confirmLabel}" a ${roleName}?`
            : ""
        }
        description={
          confirmTarget?.nextEnabled
            ? `${roleName} volverá a ver "${confirmLabel}" en el menú (${confirmGroup}) de inmediato.`
            : confirmTargetIsShared
              ? `${roleName} dejará de ver "${confirmLabel}" en el menú (${confirmGroup}). Como comparte datos con ${confirmTarget ? sharedPeerLabels(confirmTarget.moduleKey) : ""}, el dato solo queda bloqueado en el servidor si esas pantallas también quedan ocultas.`
              : `${roleName} dejará de ver "${confirmLabel}" en el menú (${confirmGroup}) y su API empezará a rechazar sus peticiones.`
        }
        confirmLabel={confirmTarget?.nextEnabled ? "Dar acceso" : "Quitar acceso"}
        variant={confirmTarget?.nextEnabled ? "default" : "destructive"}
        isLoading={setAccess.isPending}
        errorMessage={confirmErrorMessage}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
