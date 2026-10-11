"use client";

import { useState } from "react";
import { ArrowDownToLine, Check, CheckCircle2, Cookie, Gift, PackageX, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { formatDateTime, formatKg, formatInteger } from "@/lib/format";
import { useResolveInventoryMovement } from "../hooks/use-resolve-inventory-movement";
import { useReceiveInventoryMovement } from "../hooks/use-receive-inventory-movement";
import type { InventoryMovement, InventoryMovementStatus, InventoryMovementType } from "../types/inventory-movement.types";
import type { ApiError } from "@/lib/api/client";

const TYPE_LABEL: Record<InventoryMovementType, string> = {
  MERMA: "Merma",
  REGALIA: "Regalía",
  DEGUSTACION: "Degustación",
  ENTRADA: "Entrada",
};

const TYPE_ICON: Record<InventoryMovementType, typeof PackageX> = {
  MERMA: PackageX,
  REGALIA: Gift,
  DEGUSTACION: Cookie,
  ENTRADA: ArrowDownToLine,
};

const ROLE_LABEL: Record<InventoryMovement["registeredByRole"], string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Vendedor",
};

// Mismo criterio visual que StatusPill/RolePill de Usuarios — pill con
// punto de color, sin componente Badge aparte en el proyecto todavía.
// RECIBIDO usa azul/cielo para distinguirse claramente de PENDIENTE
// (ámbar) — son dos cosas distintas: "el Vendedor todavía no actúa" vs.
// "el Vendedor ya actuó, falta que Admin/Finanzas revise".
function StatusPill({ status }: { status: InventoryMovementStatus }) {
  const style: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    RECIBIDO: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    CONFIRMADO: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    RECHAZADO: "bg-muted text-muted-foreground",
  };
  const dot: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "bg-amber-500",
    RECIBIDO: "bg-sky-500",
    CONFIRMADO: "bg-emerald-500",
    RECHAZADO: "bg-muted-foreground/50",
  };
  const label: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "Pendiente",
    RECIBIDO: "Recibido",
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
  // formatea como número simple; el tipo (Merma/Regalía/Degustación/
  // Entrada) y la nota ya dan el contexto que importa.
  return Number.isInteger(quantity) ? formatInteger(quantity) : formatKg(quantity);
}

interface ReceiveMovementDialogProps {
  movement: InventoryMovement | null;
  onOpenChange: (open: boolean) => void;
}

// Modal de "Marcar como recibido" — exclusivo de ENTRADA. A diferencia de
// ConfirmDialog (que es un sí/no sin datos), acá hace falta capturar la
// cantidad real que llegó, así que es su propio Dialog. Arranca con el
// input ya lleno con la cantidad solicitada (el caso más común es que
// llegue completo) — el Vendedor solo lo cambia si no fue así.
function ReceiveMovementDialog({ movement, onOpenChange }: ReceiveMovementDialogProps) {
  const receive = useReceiveInventoryMovement();
  const [value, setValue] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);

  // Mismo criterio de "ajuste de estado durante el render" que el resto
  // del proyecto — al abrir para un movimiento nuevo, reinicia el input
  // a la cantidad solicitada y la mutación anterior.
  if (movement && movement.id !== lastId) {
    setLastId(movement.id);
    setValue(String(movement.quantity));
    receive.reset();
  }

  const numericValue = Number(value);
  const invalid = value.trim() === "" || Number.isNaN(numericValue) || numericValue < 0;

  function handleConfirm() {
    if (!movement || invalid) return;
    receive.mutate(
      { id: movement.id, receivedQuantity: numericValue },
      { onSuccess: () => setTimeout(() => onOpenChange(false), 1200) },
    );
  }

  return (
    <Dialog open={movement !== null} onOpenChange={(next) => !receive.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Marcar como recibido</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            {movement && (
              <>
                ¿Cuánto llegó de <span className="font-medium text-foreground">{movement.productName}</span>? Se
                solicitaron {formatQuantity(movement.quantity)}.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {receive.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            Recepción registrada — queda pendiente de que Admin o Finanzas lo confirme.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="received-quantity">Cantidad recibida</Label>
            <Input
              id="received-quantity"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={invalid}
              autoFocus
            />
          </div>
        )}

        {receive.isError && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {(receive.error as ApiError).message}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={receive.isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={receive.isPending || invalid || receive.isSuccess}>
            Marcar recibido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MovementsTableProps {
  movements: InventoryMovement[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  /** Solo Admin/Finanzas puede confirmar/rechazar (ver @Roles en el
   * backend) — el Vendedor ve la misma tabla pero sin estos dos botones.
   * "Marcar recibido" (ENTRADA pendiente) sí se ofrece a cualquiera que
   * vea la pantalla — el backend valida la tienda, no hace falta
   * duplicar esa regla acá. */
  canResolve: boolean;
}

export function MovementsTable({ movements, isLoading, isError, errorMessage, canResolve }: MovementsTableProps) {
  const resolve = useResolveInventoryMovement();
  const [target, setTarget] = useState<{ movement: InventoryMovement; action: "confirm" | "reject" } | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<InventoryMovement | null>(null);

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
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows rows={5} columns={8} />
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                    Todavía no hay movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => {
                  const Icon = TYPE_ICON[movement.type];
                  const canReceiveThis = movement.type === "ENTRADA" && movement.status === "PENDIENTE";
                  const canResolveThis = canResolve && (movement.status === "PENDIENTE" || movement.status === "RECIBIDO");
                  const hasDiscrepancy =
                    movement.receivedQuantity != null && movement.receivedQuantity !== movement.quantity;
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
                      <TableCell className="text-right tabular-nums">
                        {formatQuantity(movement.quantity)}
                        {movement.receivedQuantity != null && (
                          <span className={cn("block text-[11px]", hasDiscrepancy ? "text-destructive" : "text-muted-foreground")}>
                            recibido: {formatQuantity(movement.receivedQuantity)}
                          </span>
                        )}
                      </TableCell>
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
                      <TableCell className="text-right">
                        {canReceiveThis || canResolveThis ? (
                          <div className="flex justify-end gap-1.5">
                            {canReceiveThis && (
                              <Button type="button" size="sm" variant="outline" onClick={() => setReceiveTarget(movement)}>
                                <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
                                Marcar recibido
                              </Button>
                            )}
                            {canResolveThis && (
                              <>
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
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {movement.resolvedByEmail ? `Resuelto por ${movement.resolvedByEmail}` : "—"}
                          </span>
                        )}
                      </TableCell>
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
            ? `Vas a confirmar esta ${target ? TYPE_LABEL[target.movement.type].toLowerCase() : ""} de ${target?.movement.productName}. ${target?.movement.type === "ENTRADA" ? "Se sumará" : "Se restará"} del inventario estimado de la tienda.`
            : `Vas a rechazar esta ${target ? TYPE_LABEL[target.movement.type].toLowerCase() : ""} de ${target?.movement.productName}. No afectará el inventario.`
        }
        confirmLabel={target?.action === "confirm" ? "Confirmar" : "Rechazar"}
        variant={target?.action === "reject" ? "destructive" : "default"}
        onConfirm={handleConfirmDialog}
        isLoading={resolve.isPending}
        errorMessage={(resolve.error as ApiError | null)?.message}
      />

      <ReceiveMovementDialog movement={receiveTarget} onOpenChange={(next) => !next && setReceiveTarget(null)} />
    </>
  );
}
