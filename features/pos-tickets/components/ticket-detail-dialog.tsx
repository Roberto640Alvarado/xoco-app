"use client";

import type { CSSProperties, ReactNode } from "react";
import { ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoBadge } from "@/design-system/components/info-badge";
import { formatCurrency, formatInteger } from "@/lib/format";
import type { ApiError } from "@/lib/api/client";
import { usePosTicket } from "../hooks/use-pos-ticket";
import type { PosTicketDetail, PosTicketSummary } from "../types/pos-tickets.types";
import { formatLinePrice, formatLineQuantity, formatTicketLongDateTime, ticketNumber, ticketState } from "../utils/ticket-format";

interface TicketDetailDialogProps {
  /** Fila elegida en el listado: se muestra al instante mientras llega el detalle. */
  ticket: PosTicketSummary | null;
  onOpenChange: (open: boolean) => void;
}

// Borde troquelado arriba y abajo, como el papel del recibo de la caja.
const PERFORATED_EDGES = [
  "radial-gradient(circle at 7px 0, transparent 5px, #000 5.5px) top / 14px 51% repeat-x",
  "radial-gradient(circle at 7px 100%, transparent 5px, #000 5.5px) bottom / 14px 51% repeat-x",
].join(", ");
const RECEIPT_STYLE: CSSProperties = { mask: PERFORATED_EDGES, WebkitMask: PERFORATED_EDGES };

/** Fila del recibo: texto a la izquierda, puntos guía y monto alineado a la derecha. */
function LeaderRow({ label, value, strong = false }: { label: ReactNode; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex items-baseline gap-2 text-base font-semibold text-foreground" : "flex items-baseline gap-2 text-sm text-muted-foreground"}>
      <span className="shrink-0">{label}</span>
      <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border" aria-hidden="true" />
      <span className={strong ? "shrink-0 text-lg tabular-nums" : "shrink-0 tabular-nums text-foreground"}>{value}</span>
    </div>
  );
}

function DataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function Receipt({ detail }: { detail: PosTicketDetail }) {
  return (
    <div className="bg-muted px-5 py-7 dark:bg-muted/60" style={RECEIPT_STYLE}>
      <div className="flex items-baseline justify-between gap-3 pb-2 text-xs text-muted-foreground">
        <span>Producto</span>
        <span>Total</span>
      </div>
      <ul className="flex flex-col divide-y divide-dashed divide-border border-y border-dashed border-border">
        {detail.lines.map((line) => (
          <li key={line.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium text-foreground">{line.productName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatLineQuantity(line)} × {formatLinePrice(line)}
                </span>
                {line.discount > 0 && (
                  <InfoBadge tone="warning" size="sm">
                    {formatInteger(line.discount)}% de descuento
                  </InfoBadge>
                )}
                {line.isWeight && (
                  <InfoBadge tone="neutral" size="sm">
                    A granel
                  </InfoBadge>
                )}
              </div>
            </div>
            <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">{formatCurrency(line.total)}</p>
          </li>
        ))}
        {detail.lines.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">La orden no tiene productos.</li>}
      </ul>

      <div className="flex flex-col gap-1.5 pt-3">
        <LeaderRow label="Subtotal sin IVA" value={formatCurrency(detail.amountUntaxed)} />
        <LeaderRow label="Impuestos" value={formatCurrency(detail.amountTax)} />
      </div>
      <div className="my-3 border-t-2 border-double border-border" aria-hidden="true" />
      <LeaderRow label="Total" value={formatCurrency(detail.amountTotal)} strong />

      <div className="mt-4 flex flex-col gap-1.5 border-t border-dashed border-border pt-3">
        {detail.payments.map((payment) => (
          <LeaderRow key={payment.paymentMethodId} label={`Pagado con ${payment.paymentMethodName}`} value={formatCurrency(payment.amount)} />
        ))}
        {detail.payments.length === 0 && <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>}
        {detail.amountReturn !== 0 && <LeaderRow label="Cambio entregado" value={formatCurrency(Math.abs(detail.amountReturn))} />}
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {formatInteger(detail.lineCount)} {detail.lineCount === 1 ? "producto" : "productos"}
        {detail.unitCount > 0 && `, ${formatInteger(detail.unitCount)} ${detail.unitCount === 1 ? "unidad" : "unidades"}`}
      </p>
    </div>
  );
}

function ReceiptSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
      <Skeleton className="mt-2 h-6 w-1/2 self-end" />
    </div>
  );
}

function errorText(error: unknown): string {
  const apiError = error as Partial<ApiError> | null;
  if (apiError?.status === 403) return "Esta orden es de otra tienda. Solo puedes ver el detalle de las órdenes de tu tienda.";
  if (apiError?.status === 404) return "No se encontró la orden en Odoo. Actualiza el listado para ver las órdenes vigentes.";
  return apiError?.message ?? "No se pudo cargar el detalle de la orden. Vuelve a abrirla en un momento.";
}

/**
 * Detalle de una orden de caja. El contenido principal se lee como el recibo
 * impreso (productos, impuestos, total y pagos con puntos guía y borde
 * troquelado); al lado, el total destacado y los datos de la orden. En
 * pantallas chicas va todo en una columna: primero el total y los datos,
 * después el recibo, con scroll dentro del modal.
 */
export function TicketDetailDialog({ ticket, onOpenChange }: TicketDetailDialogProps) {
  const detail = usePosTicket(ticket?.id ?? null);
  const state = ticket ? ticketState(ticket.state) : null;

  return (
    <Dialog open={ticket !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {ticket && (
          <>
            <DialogHeader className="flex-row items-center gap-3 border-b border-border px-5 py-4 pr-14">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ReceiptText className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <DialogTitle className="text-base font-semibold break-all text-foreground sm:text-lg">{ticketNumber(ticket)}</DialogTitle>
                  {state && (
                    <InfoBadge tone={state.tone} dot size="sm">
                      {state.label}
                    </InfoBadge>
                  )}
                </div>
                <DialogDescription className="mt-0.5 text-xs sm:text-sm">{formatTicketLongDateTime(ticket.date, ticket.time)}</DialogDescription>
              </div>
            </DialogHeader>

            <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <aside className="flex flex-col gap-4 lg:order-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">Total cobrado</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">{formatCurrency(ticket.amountTotal)}</p>
                  {ticket.paymentMethods.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {ticket.paymentMethods.map((method) => (
                        <InfoBadge key={method} tone="neutral" size="sm">
                          {method}
                        </InfoBadge>
                      ))}
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 divide-border sm:grid-cols-3 lg:grid-cols-1 lg:divide-y">
                  <DataRow label="Tienda">{ticket.store.name}</DataRow>
                  <DataRow label="Cajero">{ticket.cashier?.name ?? "Sin cajero"}</DataRow>
                  <DataRow label="Cliente">{ticket.customer?.name ?? "Consumidor final"}</DataRow>
                  <DataRow label="Sesión de caja">{ticket.session.name}</DataRow>
                  {ticket.posReference && <DataRow label="Orden en Odoo">{ticket.name}</DataRow>}
                </dl>
              </aside>

              <section className="lg:order-1" aria-label="Recibo">
                {detail.isLoading ? (
                  <ReceiptSkeleton />
                ) : detail.isError ? (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
                    {errorText(detail.error)}
                  </p>
                ) : detail.data ? (
                  <Receipt detail={detail.data} />
                ) : null}
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
