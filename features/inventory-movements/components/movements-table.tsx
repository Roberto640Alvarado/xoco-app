"use client";

import { useState } from "react";
import { ArrowDownToLine, Check, CheckCircle2, Cookie, Gift, PackageX, Truck, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { useAcceptInventoryMovement } from "../hooks/use-accept-inventory-movement";
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
// Cada paso del flujo de ENTRADA tiene su propio color: PENDIENTE (ámbar,
// falta que Admin/Finanzas responda), EN_CAMINO (violeta, ya aceptada),
// RECIBIDO (cielo, falta la confirmación final).
function StatusPill({ status }: { status: InventoryMovementStatus }) {
  const style: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    EN_CAMINO: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    RECIBIDO: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    CONFIRMADO: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    RECHAZADO: "bg-destructive/10 text-destructive",
  };
  const dot: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "bg-amber-500",
    EN_CAMINO: "bg-violet-500",
    RECIBIDO: "bg-sky-500",
    CONFIRMADO: "bg-emerald-500",
    RECHAZADO: "bg-destructive",
  };
  const label: Record<InventoryMovementStatus, string> = {
    PENDIENTE: "Pendiente",
    EN_CAMINO: "En camino",
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

// Una línea que explica en qué paso está y qué sigue, según quién mira —
// el Vendedor necesita saber que "Recibido" todavía no suma al stock.
function statusHint(movement: InventoryMovement, isAdmin: boolean): string | null {
  const isEntrada = movement.type === "ENTRADA";
  switch (movement.status) {
    case "PENDIENTE":
      if (isEntrada) return isAdmin ? "Solicitud nueva — acéptala o recházala." : "Esperando respuesta de Admin o Finanzas.";
      return isAdmin ? "Falta confirmar o rechazar." : "Pendiente de confirmación de Admin o Finanzas.";
    case "EN_CAMINO":
      return isAdmin
        ? "Aceptada — esperando que la tienda la reciba."
        : "Aceptada y en camino — márcala como recibida cuando llegue.";
    case "RECIBIDO":
      return isAdmin
        ? "La tienda ya la recibió — confirma para sumarla al stock."
        : "En proceso de aprobación — se sumará al stock cuando Admin o Finanzas confirme.";
    case "CONFIRMADO":
      return isEntrada ? "Sumada al stock de la tienda." : null;
    default:
      return null;
  }
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
            Recepción registrada — está en proceso de aprobación y se sumará al stock cuando Admin o Finanzas confirme.
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

interface RejectMovementDialogProps {
  movement: InventoryMovement | null;
  onOpenChange: (open: boolean) => void;
}

// Rechazar exige un motivo (lo ve el Vendedor) — por eso es su propio
// Dialog con un campo de texto y no un ConfirmDialog sí/no.
function RejectMovementDialog({ movement, onOpenChange }: RejectMovementDialogProps) {
  const resolve = useResolveInventoryMovement();
  const [reason, setReason] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);

  if (movement && movement.id !== lastId) {
    setLastId(movement.id);
    setReason("");
    resolve.reset();
  }

  const invalid = reason.trim().length < 3;

  function handleReject() {
    if (!movement || invalid) return;
    resolve.mutate(
      { id: movement.id, action: "reject", reason: reason.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={movement !== null} onOpenChange={(next) => !resolve.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {movement?.type === "ENTRADA" ? "Rechazar solicitud" : "Rechazar movimiento"}
          </DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            {movement && (
              <>
                {TYPE_LABEL[movement.type]} de <span className="font-medium text-foreground">{movement.productName}</span>
                . No afectará el inventario. El Vendedor verá el motivo.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reject-reason">Motivo</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. no hay existencia en planta esta semana..."
            maxLength={300}
            autoFocus
          />
        </div>

        {resolve.isError && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {(resolve.error as ApiError).message}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={resolve.isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleReject} disabled={resolve.isPending || invalid}>
            Rechazar
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
  /** Solo Admin/Finanzas puede aceptar/confirmar/rechazar (ver @Roles en
   * el backend) — el Vendedor ve la misma tabla sin esos botones.
   * "Marcar recibido" (ENTRADA en camino) sí se ofrece a cualquiera que
   * vea la pantalla — el backend valida la tienda, no hace falta
   * duplicar esa regla acá. */
  canResolve: boolean;
  /** Si viene, se agrega la columna "Tienda" (bandeja de todas las tiendas). */
  storeNames?: Map<number, string>;
  emptyMessage?: string;
}

export function MovementsTable({
  movements,
  isLoading,
  isError,
  errorMessage,
  canResolve,
  storeNames,
  emptyMessage = "Todavía no hay movimientos registrados.",
}: MovementsTableProps) {
  const resolve = useResolveInventoryMovement();
  const accept = useAcceptInventoryMovement();
  const [target, setTarget] = useState<{ movement: InventoryMovement; action: "confirm" | "accept" } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<InventoryMovement | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<InventoryMovement | null>(null);

  const columns = 8 + (storeNames ? 1 : 0);

  function handleConfirmDialog() {
    if (!target) return;
    if (target.action === "accept") {
      accept.mutate({ id: target.movement.id }, { onSuccess: () => setTarget(null) });
      return;
    }
    resolve.mutate({ id: target.movement.id, action: "confirm" }, { onSuccess: () => setTarget(null) });
  }

  if (isError) return <ChartErrorState message={errorMessage} />;

  const activeMutation = target?.action === "accept" ? accept : resolve;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="max-h-[65vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Fecha</TableHead>
                {storeNames && <TableHead>Tienda</TableHead>}
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
                <TableSkeletonRows rows={5} columns={columns} />
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns} className="h-32 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => {
                  const Icon = TYPE_ICON[movement.type];
                  const isEntrada = movement.type === "ENTRADA";
                  const canReceiveThis = isEntrada && movement.status === "EN_CAMINO";
                  // Admin/Finanzas: una ENTRADA se acepta (PENDIENTE) y
                  // luego se confirma (RECIBIDO); lo demás se confirma
                  // directo desde PENDIENTE. Rechazar vale mientras siga
                  // abierto.
                  const canAcceptThis = canResolve && isEntrada && movement.status === "PENDIENTE";
                  const canConfirmThis =
                    canResolve && (isEntrada ? movement.status === "RECIBIDO" : movement.status === "PENDIENTE");
                  const canRejectThis =
                    canResolve && (movement.status === "PENDIENTE" || movement.status === "EN_CAMINO" || movement.status === "RECIBIDO");
                  const hasActions = canReceiveThis || canAcceptThis || canConfirmThis || canRejectThis;
                  const hasDiscrepancy =
                    movement.receivedQuantity != null && movement.receivedQuantity !== movement.quantity;
                  const hint = statusHint(movement, canResolve);
                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(movement.occurredAt)}
                      </TableCell>
                      {storeNames && (
                        <TableCell className="whitespace-nowrap font-medium">
                          {storeNames.get(movement.posConfigId) ?? `Tienda ${movement.posConfigId}`}
                        </TableCell>
                      )}
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
                      <TableCell className="max-w-[240px] whitespace-normal">
                        <StatusPill status={movement.status} />
                        {movement.status === "RECHAZADO" && movement.rejectionReason ? (
                          <span className="mt-1 block text-[11px] text-destructive">Motivo: {movement.rejectionReason}</span>
                        ) : (
                          hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasActions ? (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {canReceiveThis && (
                              <Button type="button" size="sm" variant="outline" onClick={() => setReceiveTarget(movement)}>
                                <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
                                Marcar recibido
                              </Button>
                            )}
                            {canAcceptThis && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setTarget({ movement, action: "accept" })}
                              >
                                <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                                Aceptar
                              </Button>
                            )}
                            {canConfirmThis && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setTarget({ movement, action: "confirm" })}
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                Confirmar
                              </Button>
                            )}
                            {canRejectThis && (
                              <Button type="button" size="sm" variant="outline" onClick={() => setRejectTarget(movement)}>
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                Rechazar
                              </Button>
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
        title={
          target?.action === "accept"
            ? "Aceptar solicitud"
            : target?.movement.type === "ENTRADA"
              ? "Confirmar entrada"
              : "Confirmar movimiento"
        }
        description={
          target?.action === "accept"
            ? `Vas a aceptar la solicitud de ${target.movement.productName}: la tienda la verá como "en camino". Todavía no se suma al stock — eso pasa cuando confirmes la recepción.`
            : `Vas a confirmar esta ${target ? TYPE_LABEL[target.movement.type].toLowerCase() : ""} de ${target?.movement.productName}. ${target?.movement.type === "ENTRADA" ? "Se sumará" : "Se restará"} del inventario estimado de la tienda.`
        }
        confirmLabel={target?.action === "accept" ? "Aceptar" : "Confirmar"}
        onConfirm={handleConfirmDialog}
        isLoading={activeMutation.isPending}
        errorMessage={(activeMutation.error as ApiError | null)?.message}
      />

      <RejectMovementDialog movement={rejectTarget} onOpenChange={(next) => !next && setRejectTarget(null)} />
      <ReceiveMovementDialog movement={receiveTarget} onOpenChange={(next) => !next && setReceiveTarget(null)} />
    </>
  );
}
