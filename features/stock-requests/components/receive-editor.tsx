"use client";

import { useMemo, useState } from "react";
import { CheckCheck, PackageCheck } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfoBadge } from "@/design-system/components/info-badge";
import { QuantityStepper } from "@/design-system/components/quantity-stepper";
import { useReceiveStockRequest } from "../hooks/use-stock-request-actions";
import { formatLineQuantity, groupByCategory } from "../lib/group-by-category";
import { replacedName } from "../lib/substitution";
import type { StockRequest } from "../types/stock-request.types";

interface ReceiveLine {
  productId: number;
  productName: string;
  categoryName: string;
  unit: "unidad" | "kg";
  requested: number;
  sent: number;
  received: number;
  note: string;
  plantNote: string | null;
  /** Nombre del producto pedido al que sustituye (planta lo mandó "en su lugar"). */
  replaces: string | null;
}

interface ReceiveEditorProps {
  request: StockRequest;
  onDone: () => void;
}

// La tienda solo confirma: cada producto arranca con lo que planta envió
// (lo normal es que llegue completo) y solo se cambia lo que no coincide,
// con una observación. Recién al confirmar se suma al inventario.
export function ReceiveEditor({ request, onDone }: ReceiveEditorProps) {
  const receive = useReceiveStockRequest();
  const [lines, setLines] = useState<ReceiveLine[]>(() =>
    request.lines
      .filter((line) => (line.sentQuantity ?? 0) > 0)
      .map((line) => ({
        productId: line.productId,
        productName: line.productName,
        categoryName: line.categoryName,
        unit: line.unit,
        requested: line.requestedQuantity,
        sent: line.sentQuantity ?? 0,
        received: line.sentQuantity ?? 0,
        note: "",
        plantNote: line.plantNote,
        replaces: replacedName(line, request.lines),
      })),
  );
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const groups = useMemo(() => groupByCategory(lines), [lines]);
  const notSent = request.lines.filter((line) => (line.sentQuantity ?? 0) <= 0 && !line.addedByPlant);
  const differing = lines.filter((line) => line.received !== line.sent);
  const missingNote = differing.filter((line) => line.note.trim().length === 0);
  const canConfirm = missingNote.length === 0;

  function update(productId: number, patch: Partial<ReceiveLine>) {
    setLines((current) => current.map((line) => (line.productId === productId ? { ...line, ...patch } : line)));
  }

  function confirm() {
    receive.mutate(
      {
        id: request.id,
        payload: {
          note: note.trim() || undefined,
          lines: lines.map((line) => ({
            productId: line.productId,
            receivedQuantity: line.received,
            note: line.note.trim() || undefined,
          })),
        },
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onDone();
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
        <p className="min-w-0 flex-1 text-sm text-foreground">
          <span className="font-semibold">Qué hacer:</span> 1) Revisa que cada producto coincida con lo que llegó. 2) Si algo no coincide, cambia la cantidad y anota qué pasó. 3) Pulsa “Confirmar recepción”.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={differing.length === 0 || receive.isPending}
          onClick={() => setLines((current) => current.map((line) => ({ ...line, received: line.sent, note: "" })))}
        >
          <CheckCheck className="size-3.5" aria-hidden="true" />
          Todo llegó bien
        </Button>
      </div>

      {notSent.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Planta no envió: </span>
          {notSent.map((line) => line.productName).join(", ")}.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <section key={group.category} className="overflow-hidden rounded-xl border border-border">
            <h3 className="bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground">{group.category}</h3>
            <ul className="divide-y divide-border">
              {group.items.map((line) => {
                const differs = line.received !== line.sent;
                return (
                  <li key={line.productId} className={cn("flex flex-col gap-2 px-3 py-2.5", differs && "bg-destructive/5")}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="text-sm font-medium text-foreground">{line.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Pediste {formatLineQuantity(line.requested, line.unit)} · Planta envió {formatLineQuantity(line.sent, line.unit)}
                          {line.requested === 0 && (
                            <InfoBadge tone="violet" size="sm" className="ml-1.5">
                              {line.replaces ? `En lugar de ${line.replaces}` : "Agregado por planta"}
                            </InfoBadge>
                          )}
                        </p>
                        {line.plantNote && <p className="text-xs text-foreground/70">Planta: “{line.plantNote}”</p>}
                      </div>
                      <QuantityStepper
                        value={line.received}
                        onChange={(next) => update(line.productId, { received: next ?? 0 })}
                        step={line.unit === "kg" ? 0.5 : 1}
                        ariaLabel={`Cantidad recibida de ${line.productName}`}
                        disabled={receive.isPending}
                      />
                    </div>
                    {differs && (
                      <Input
                        value={line.note}
                        onChange={(event) => update(line.productId, { note: event.target.value })}
                        maxLength={200}
                        placeholder={`Llegaron ${formatLineQuantity(line.received, line.unit)} de ${formatLineQuantity(line.sent, line.unit)}: ¿qué pasó?`}
                        aria-label={`Observación de ${line.productName}`}
                        aria-invalid={line.note.trim().length === 0}
                        className="h-8 text-xs"
                        disabled={receive.isPending}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="receive-note">Nota general (opcional)</Label>
        <Textarea id="receive-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
      </div>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
        <p className={cn("text-xs", canConfirm ? "text-muted-foreground" : "text-destructive")}>
          {!canConfirm
            ? `Explica la diferencia en ${missingNote.length} producto${missingNote.length === 1 ? "" : "s"}.`
            : differing.length > 0
              ? `${differing.length} con diferencia: quedará registrada.`
              : "Todo coincide con lo enviado."}
        </p>
        <Button type="button" disabled={!canConfirm || receive.isPending} onClick={() => setConfirmOpen(true)}>
          <PackageCheck className="size-4" aria-hidden="true" />
          Confirmar recepción
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar recepción"
        description={
          differing.length > 0
            ? `Se sumará lo que recibiste al inventario de la tienda. ${differing.length} producto${differing.length === 1 ? "" : "s"} con diferencia quedan registrados.`
            : "Se sumará todo lo enviado al inventario de la tienda."
        }
        confirmLabel="Confirmar"
        isLoading={receive.isPending}
        errorMessage={receive.error?.message}
        onConfirm={confirm}
      />
    </div>
  );
}
