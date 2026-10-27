"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCancelStockRequest } from "../hooks/use-stock-request-actions";
import type { StockRequest } from "../types/stock-request.types";

interface CancelRequestDialogProps {
  request: StockRequest | null;
  onOpenChange: (open: boolean) => void;
}

// Cancelar exige un motivo: lo ve la otra parte en el seguimiento.
export function CancelRequestDialog({ request, onOpenChange }: CancelRequestDialogProps) {
  const cancel = useCancelStockRequest();
  const [reason, setReason] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);

  if (request && request.id !== lastId) {
    setLastId(request.id);
    setReason("");
    cancel.reset();
  }

  const invalid = reason.trim().length < 3;

  return (
    <Dialog open={request !== null} onOpenChange={(next) => !cancel.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Cancelar {request?.code}</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            No se moverá el inventario. Todos los que siguen la solicitud verán el motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-reason">Motivo</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={300}
            placeholder="Ej. planta no tiene existencia esta semana..."
            autoFocus
          />
        </div>
        {cancel.isError && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {cancel.error.message}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>
            Volver
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={cancel.isPending || invalid}
            onClick={() => request && cancel.mutate({ id: request.id, reason: reason.trim() }, { onSuccess: () => onOpenChange(false) })}
          >
            Cancelar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
