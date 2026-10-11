"use client";

import { useState, type ReactNode } from "react";
import { ArrowDownToLine, Check, CheckCircle2, ChevronRight, Cookie, Gift, PackageX, Truck, X } from "lucide-react";
import { cn } from "cn";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
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
import { InfoHint, type InfoTopic } from "@/features/inventory-guide/components/info-hint";
import { InfoBadge, type InfoBadgeTone } from "@/components/ui/info-badge";
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

const STATUS_LABEL: Record<InventoryMovementStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_CAMINO: "En camino",
  RECIBIDO: "Recibido",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
};

// Cada paso del flujo de ENTRADA tiene su propio tono (ver InfoBadge):
// PENDIENTE (ámbar, falta que Admin/Finanzas responda), EN_CAMINO (violeta,
// ya aceptada), RECIBIDO (cielo, falta la confirmación final).
const STATUS_TONE: Record<InventoryMovementStatus, InfoBadgeTone> = {
  PENDIENTE: "warning",
  EN_CAMINO: "violet",
  RECIBIDO: "info",
  CONFIRMADO: "success",
  RECHAZADO: "danger",
};

function StatusPill({ status }: { status: InventoryMovementStatus }) {
  return (
    <InfoBadge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </InfoBadge>
  );
}

// Una línea que explica en qué paso está y qué sigue, según quién mira —
// el Vendedor necesita saber que "Recibido" todavía no suma al stock.
function statusHint(movement: InventoryMovement, isAdmin: boolean): string | null {
  const isEntrada = movement.type === "ENTRADA";
  switch (movement.status) {
    case "PENDIENTE":
      if (isEntrada) return isAdmin ? "Solicitud nueva: acéptala o recházala." : "Esperando respuesta de Admin o Finanzas.";
      return isAdmin ? "Falta confirmar o rechazar." : "Pendiente de confirmación de Admin o Finanzas.";
    case "EN_CAMINO":
      return isAdmin
        ? "Aceptada, esperando que la tienda la reciba."
        : "Aceptada y en camino. Márcala como recibida cuando llegue.";
    case "RECIBIDO":
      return isAdmin
        ? "La tienda ya la recibió. Confirma para sumarla al stock."
        : "En proceso de aprobación. Se sumará al stock cuando Admin o Finanzas confirme.";
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
            Recepción registrada. Está en proceso de aprobación y se sumará al stock cuando Admin o Finanzas confirme.
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

interface MovementDetailDialogProps {
  movement: InventoryMovement | null;
  onOpenChange: (open: boolean) => void;
  storeName?: string;
  isAdmin: boolean;
  /** Botones de gestión (aceptar / confirmar / rechazar / marcar recibido). */
  actions: ReactNode;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

// Detalle completo de un movimiento: la tabla muestra solo lo esencial y
// aquí vive el resto (nota, quién lo registró/resolvió, motivo del rechazo)
// junto con los botones de gestión que correspondan al rol y al estado.
function MovementDetailDialog({ movement, onOpenChange, storeName, isAdmin, actions }: MovementDetailDialogProps) {
  const hint = movement ? statusHint(movement, isAdmin) : null;
  const Icon = movement ? TYPE_ICON[movement.type] : null;
  return (
    <Dialog open={movement !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {movement && Icon && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                {movement.type === "ENTRADA" ? "Solicitud de stock" : TYPE_LABEL[movement.type]}
              </DialogTitle>
              <DialogDescription className="pt-1 leading-relaxed">
                <span className="font-medium text-foreground">{movement.productName}</span>
                {storeName ? ` · ${storeName}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1">
              <StatusPill status={movement.status} />
              {movement.status === "RECHAZADO" && movement.rejectionReason ? (
                <p className="text-sm text-destructive">Motivo: {movement.rejectionReason}</p>
              ) : (
                hint && <p className="text-sm text-muted-foreground">{hint}</p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border p-3">
              <DetailRow label="Cantidad">
                <span className="tabular-nums">{formatQuantity(movement.quantity)}</span>
              </DetailRow>
              <DetailRow label="Cantidad recibida">
                {movement.receivedQuantity != null ? (
                  <span
                    className={cn(
                      "tabular-nums",
                      movement.receivedQuantity !== movement.quantity && "text-destructive",
                    )}
                  >
                    {formatQuantity(movement.receivedQuantity)}
                  </span>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Fecha">{formatDateTime(movement.occurredAt)}</DetailRow>
              <DetailRow label="Registrado por">
                {movement.registeredByEmail}
                <span className="block text-[11px] text-muted-foreground">{ROLE_LABEL[movement.registeredByRole]}</span>
              </DetailRow>
              {movement.acceptedByEmail && (
                <DetailRow label="Aceptada por">
                  {movement.acceptedByEmail}
                  {movement.acceptedAt && (
                    <span className="block text-[11px] text-muted-foreground">{formatDateTime(movement.acceptedAt)}</span>
                  )}
                </DetailRow>
              )}
              {movement.resolvedByEmail && (
                <DetailRow label={movement.status === "RECHAZADO" ? "Rechazada por" : "Resuelta por"}>
                  {movement.resolvedByEmail}
                  {movement.resolvedAt && (
                    <span className="block text-[11px] text-muted-foreground">{formatDateTime(movement.resolvedAt)}</span>
                  )}
                </DetailRow>
              )}
              <div className="col-span-2">
                <DetailRow label="Nota">{movement.note ?? "—"}</DetailRow>
              </div>
            </dl>

            {actions && <DialogFooter className="sm:justify-start">{actions}</DialogFooter>}
          </>
        )}
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
  /** Qué explica el ⓘ junto a "Estado" (solicitudes vs. movimientos). */
  statusInfo?: InfoTopic;
}

export function MovementsTable({
  movements,
  isLoading,
  isError,
  errorMessage,
  canResolve,
  storeNames,
  emptyMessage = "Todavía no hay movimientos registrados.",
  statusInfo = "estados-movimiento",
}: MovementsTableProps) {
  const resolve = useResolveInventoryMovement();
  const accept = useAcceptInventoryMovement();
  const [target, setTarget] = useState<{ movement: InventoryMovement; action: "confirm" | "accept" } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<InventoryMovement | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<InventoryMovement | null>(null);
  const [detailTarget, setDetailTarget] = useState<InventoryMovement | null>(null);

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

  // Qué puede hacer quien mira con este movimiento. Admin/Finanzas: una
  // ENTRADA se acepta (PENDIENTE) y luego se confirma (RECIBIDO); lo demás se
  // confirma directo desde PENDIENTE. Rechazar vale mientras siga abierto.
  // El Vendedor solo puede marcar recibida una ENTRADA en camino.
  function actionState(movement: InventoryMovement) {
    const isEntrada = movement.type === "ENTRADA";
    const receive = isEntrada && movement.status === "EN_CAMINO";
    const accept = canResolve && isEntrada && movement.status === "PENDIENTE";
    const confirm = canResolve && (isEntrada ? movement.status === "RECIBIDO" : movement.status === "PENDIENTE");
    const reject =
      canResolve && (movement.status === "PENDIENTE" || movement.status === "EN_CAMINO" || movement.status === "RECIBIDO");
    return { receive, accept, confirm, reject, any: receive || accept || confirm || reject };
  }

  // Cierra el detalle antes de abrir el diálogo de la acción elegida.
  function startAction(open: () => void) {
    setDetailTarget(null);
    open();
  }

  function renderActions(movement: InventoryMovement) {
    const state = actionState(movement);
    if (!state.any) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {state.receive && (
          <Button type="button" size="sm" onClick={() => startAction(() => setReceiveTarget(movement))}>
            <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
            Marcar recibido
          </Button>
        )}
        {state.accept && (
          <Button type="button" size="sm" onClick={() => startAction(() => setTarget({ movement, action: "accept" }))}>
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            Aceptar
          </Button>
        )}
        {state.confirm && (
          <Button type="button" size="sm" onClick={() => startAction(() => setTarget({ movement, action: "confirm" }))}>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Confirmar
          </Button>
        )}
        {state.reject && (
          <Button type="button" size="sm" variant="outline" onClick={() => startAction(() => setRejectTarget(movement))}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Rechazar
          </Button>
        )}
      </div>
    );
  }

  const typeOptions = (Object.keys(TYPE_LABEL) as InventoryMovementType[]).map((type) => ({
    value: TYPE_LABEL[type],
    label: TYPE_LABEL[type],
  }));
  const statusOptions = (Object.keys(STATUS_LABEL) as InventoryMovementStatus[]).map((status) => ({
    value: STATUS_LABEL[status],
    label: STATUS_LABEL[status],
  }));

  const columns: DataTableColumn<InventoryMovement>[] = [
    {
      id: "date",
      header: "Fecha",
      label: "Fecha",
      cell: (movement) => <span className="text-muted-foreground">{formatDateTime(movement.occurredAt)}</span>,
      accessor: (movement) => formatDateTime(movement.occurredAt),
      filter: "text",
      nowrap: true,
    },
    ...(storeNames
      ? [
          {
            id: "store",
            header: "Tienda",
            label: "Tienda",
            cell: (movement: InventoryMovement) => (
              <span className="font-medium">{storeNames.get(movement.posConfigId) ?? `Tienda ${movement.posConfigId}`}</span>
            ),
            accessor: (movement: InventoryMovement) =>
              storeNames.get(movement.posConfigId) ?? `Tienda ${movement.posConfigId}`,
            filter: "select" as const,
          },
        ]
      : []),
    {
      id: "product",
      header: "Producto",
      label: "Producto",
      cell: (movement) => movement.productName,
      accessor: (movement) => movement.productName,
      filter: "text",
      mobile: "title",
    },
    {
      id: "type",
      header: "Motivo",
      label: "Motivo",
      cell: (movement) => {
        const Icon = TYPE_ICON[movement.type];
        return (
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {TYPE_LABEL[movement.type]}
          </span>
        );
      },
      accessor: (movement) => TYPE_LABEL[movement.type],
      filter: "select",
      filterOptions: typeOptions,
      nowrap: true,
    },
    {
      id: "quantity",
      header: "Cantidad",
      label: "Cantidad",
      cell: (movement) => {
        const hasDiscrepancy = movement.receivedQuantity != null && movement.receivedQuantity !== movement.quantity;
        return (
          <span className="tabular-nums">
            {formatQuantity(movement.quantity)}
            {movement.receivedQuantity != null && (
              <span className={cn("block text-[11px]", hasDiscrepancy ? "text-destructive" : "text-muted-foreground")}>
                recibido: {formatQuantity(movement.receivedQuantity)}
              </span>
            )}
          </span>
        );
      },
      align: "right",
      nowrap: true,
    },
    {
      id: "status",
      header: (
        <span className="inline-flex items-center gap-1">
          Estado
          <InfoHint topic={statusInfo} />
        </span>
      ),
      label: "Estado",
      cell: (movement) => <StatusPill status={movement.status} />,
      accessor: (movement) => STATUS_LABEL[movement.status],
      filter: "select",
      filterOptions: statusOptions,
      nowrap: true,
      tourId: "status",
    },
    {
      id: "detail",
      header: "Detalle",
      label: "Detalle",
      cell: (movement) => (
        <Button
          type="button"
          size="sm"
          variant={actionState(movement).any ? "default" : "outline"}
          onClick={() => setDetailTarget(movement)}
        >
          {actionState(movement).any ? "Gestionar" : "Ver detalle"}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      ),
      align: "right",
      nowrap: true,
      tourId: "actions",
      mobile: "footer",
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={movements}
        getRowKey={(movement) => movement.id}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        itemLabel={{ singular: "movimiento", plural: "movimientos" }}
        tourId="movements-table"
        onRowClick={setDetailTarget}
      />

      <MovementDetailDialog
        movement={detailTarget}
        onOpenChange={(next) => !next && setDetailTarget(null)}
        storeName={detailTarget ? storeNames?.get(detailTarget.posConfigId) : undefined}
        isAdmin={canResolve}
        actions={detailTarget ? renderActions(detailTarget) : null}
      />

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
