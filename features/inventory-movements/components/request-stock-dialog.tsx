"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { useCreateInventoryMovement } from "../hooks/use-create-inventory-movement";
import { requestStockSchema, type RequestStockFormValues } from "../schemas/request-stock.schema";
import type { ApiError } from "@/lib/api/client";

const DEFAULT_VALUES: Partial<RequestStockFormValues> = { note: "" };

interface RequestStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posConfigId: number;
  storeName?: string;
}

// "Solicitar stock": el Vendedor pide más de un producto a planta. Es una
// ENTRADA en PENDIENTE — Admin/Finanzas la acepta (en camino) o la rechaza
// con motivo, y cuando llega el Vendedor la marca recibida (ver
// MovementsTable). Mismo patrón de modal que CreateMovementDialog.
export function RequestStockDialog({ open, onOpenChange, posConfigId, storeName }: RequestStockDialogProps) {
  const createMovement = useCreateInventoryMovement();
  const { data: items, isLoading: itemsLoading } = useInventoryItems(open ? posConfigId : undefined);
  const [wasOpen, setWasOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestStockFormValues>({
    resolver: zodResolver(requestStockSchema),
    defaultValues: DEFAULT_VALUES,
  });

  if (open && !wasOpen) {
    setWasOpen(true);
    reset(DEFAULT_VALUES);
    createMovement.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function onSubmit(values: RequestStockFormValues) {
    createMovement.mutate(
      { posConfigId, type: "ENTRADA", ...values, note: values.note?.trim() || undefined },
      { onSuccess: () => setTimeout(() => onOpenChange(false), 1200) },
    );
  }

  const errorMessage = (createMovement.error as ApiError | null)?.message;
  const sortedItems = [...(items ?? [])].sort((a, b) => a.productName.localeCompare(b.productName));

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Solicitar stock</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            Pide más de un producto{storeName ? ` para ${storeName}` : ""}. Admin o Finanzas la recibe, te avisa si va
            en camino (o por qué no) y, cuando llegue, la marcas como recibida.
          </DialogDescription>
        </DialogHeader>

        {createMovement.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            Solicitud enviada — Admin o Finanzas ya la ve en su bandeja.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="request-product">Producto</Label>
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(next) => field.onChange(Number(next))}
                  >
                    <SelectTrigger id="request-product" className="w-full">
                      <SelectValue placeholder={itemsLoading ? "Cargando..." : "Selecciona un producto"}>
                        {(raw: string) =>
                          raw
                            ? (sortedItems.find((item) => String(item.productId) === raw)?.productName ?? raw)
                            : itemsLoading
                              ? "Cargando..."
                              : "Selecciona un producto"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sortedItems.map((item) => (
                        <SelectItem key={item.productId} value={String(item.productId)}>
                          {item.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="request-quantity">Cantidad que necesitas</Label>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <Input
                    id="request-quantity"
                    type="number"
                    min={0.01}
                    step="0.01"
                    inputMode="decimal"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                )}
              />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="request-note">Nota (opcional)</Label>
              <Controller
                control={control}
                name="note"
                render={({ field }) => (
                  <Textarea {...field} id="request-note" placeholder="Ej. para el fin de semana, pedido grande..." />
                )}
              />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createMovement.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
