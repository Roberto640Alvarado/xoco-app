"use client";

import { useState } from "react";
import { Check, Cookie, Gift, PackageX, X } from "lucide-react";
import { cn } from "cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { formatDateTime, formatKg, formatInteger } from "@/lib/format";
import { useResolveInventoryMovement } from "../hooks/use-resolve-inventory-movement";
import type { InventoryMovement, InventoryMovementStatus, InventoryMovementType } from "../types/inventory-movement.types";
import type { ApiError } from "@/lib/api/client";

const TYPE_LABEL: Record<InventoryMovementType, string> = {
  MERMA: "Merma",
  REGALIA: "Regalía",
  DEGUSTACION: "Degustación",
};

const TYPE_ICON: Record<InventoryMovementType, typeof PackageX> = {
  MERMA: PackageX,
  REGALIA: Gift,
  DEGUSTACION: Cookie,
};

const ROLE_LABEL: Record<InventoryMovement["registeredByRole"], string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Vendedor",
};

// Mismo criterio visual que StatusPill/RolePill de Usuarios — pill con
// punto de color, sin componente Badge aparte en el proyecto todavía.
function StatusPill({ status }: { status: InventoryMovementStatus }) {
  const style: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    CONFIRMADO: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    RECHAZADO: "bg-muted text-muted-foreground",
  };
  const dot: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "bg-amber-500",
    CONFIRMADO: "bg-emerald-500",
    RECHAZADO: "bg-muted-foreground/50",
  };
  const label: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "Pendiente",
    CONFIRMADO: "Confirmado",
    RECHAZADO: "Rechazado",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", style[status])}>
      <span className={cn("size-1.5 rounded-full", dot[status])} aria-hidden="true" />
      {label[status]}
    </span>
  );
}

function formatQuantity(quantity: number): string {
  // No se guarda la unidad del producto en el movimiento (ver
  // StoreInventoryMovement) — a diferencia de InventoryTable, acá se
  // formatea como número simple; el tipo (Merma/Regalía/Degustación) y
  // la nota ya dan el contexto que importa.
  return Number.isInteger(quantity) ? formatInteger(quantity) : formatKg(quantity);
}

interface MovementsTableProps {
  movements: InventoryMovement[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  /** Solo Admin/Finanzas puede confirmar/rechazar (ver @Roles en el
   * backend) — el Vendedor ve la misma tabla pero sin estas acciones. */
  canResolve: boolean;
}

export function MovementsTable({ movements, isLoading, isError, errorMessage, canResolve }: MovementsTableProps) {
  const resolve = useResolveInventoryMovement();
  const [target, setTarget] = useState<{ movement: InventoryMovement; action: "confirm" | "reject" } | null>(null);

  function handleConfirmDialog() {
    if (!target) return;
    resolve.mutate(
      { id: target.movement.id, action: target.action },
      { onSuccess: () => setTarget(null) },
    );
  }

  if (isError) return <ChartErrorState message={errorMessage} />;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead>Estado</TableHead>
                {canResolve && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows rows={5} columns={canResolve ? 8 : 7} />
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canResolve ? 8 : 7} className="h-32 text-center text-sm text-muted-foreground">
                    Todavía no hay movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => {
                  const Icon = TYPE_ICON[movement.type];
                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(movement.occurredAt)}
                      </TableCell>
                      <TableCell className="whitespace-normal">{movement.productName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          {TYPE_LABEL[movement.type]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatQuantity(movement.quantity)}</TableCell>
                      <TableCell className="max-w-[220px] whitespace-normal text-muted-foreground">
                        {movement.note ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {movement.registeredByEmail}
                        <span className="block text-[11px]">{ROLE_LABEL[movement.registeredByRole]}</span>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={movement.status} />
                      </TableCell>
                      {canResolve && (
                        <TableCell className="text-right">
                          {movement.status === "PENDIENTE" ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setTarget({ movement, action: "confirm" })}
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                Confirmar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setTarget({ movement, action: "reject" })}
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                Rechazar
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {movement.resolvedByEmail ? `Resuelto por ${movement.resolvedByEmail}` : "—"}
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(next) => !next && setTarget(null)}
        title={target?.action === "confirm" ? "Confirmar movimiento" : "Rechazar movimiento"}
        description={
          target?.action === "confirm"
            ? `Vas a confirmar esta ${target ? TYPE_LABEL[target.movement.type].toLowerCase() : ""} de ${target?.movement.productName}. Se restará del inventario estimado de la tienda.`
            : `Vas a rechazar esta ${target ? TYPE_LABEL[target.movement.type].toLowerCase() : ""} de ${target?.movement.productName}. No afectará el inventario.`
        }
        confirmLabel={target?.action === "confirm" ? "Confirmar" : "Rechazar"}
        variant={target?.action === "reject" ? "destructive" : "default"}
        onConfirm={handleConfirmDialog}
        isLoading={resolve.isPending}
        errorMessage={(resolve.error as ApiError | null)?.message}
      />
    </>
  );
}
