"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownToLine, CheckCircle2, Cookie, Gift, Loader2, PackageX } from "lucide-react";
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
import { createMovementSchema, type CreateMovementFormValues } from "../schemas/create-movement.schema";
import type { ApiError } from "@/lib/api/client";
import type { InventoryMovementType } from "../types/inventory-movement.types";

const TYPE_OPTIONS: Array<{ value: InventoryMovementType; label: string; icon: typeof PackageX }> = [
  { value: "MERMA", label: "Merma", icon: PackageX },
  { value: "REGALIA", label: "Regalía", icon: Gift },
  { value: "DEGUSTACION", label: "Degustación", icon: Cookie },
  { value: "ENTRADA", label: "Entrada (envío planta→tienda)", icon: ArrowDownToLine },
];

const DEFAULT_VALUES: Partial<CreateMovementFormValues> = {
  note: "",
};

interface CreateMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posConfigId: number;
  storeName?: string;
  /** El Vendedor ve un texto distinto: su registro queda pendiente de
   * confirmación en vez de aplicarse de inmediato (ver backend). */
  isVendedor: boolean;
}

// Modal de "Registrar movimiento" — mismo patrón que CreateUserModal
// (Dialog controlado desde afuera, éxito visible que auto-cierra, error
// inline sin cerrar). El producto se elige del mismo catálogo que ya usa
// InventoryTable (GET .../items) para no duplicar una lista de productos
// aparte.
export function CreateMovementDialog({
  open,
  onOpenChange,
  posConfigId,
  storeName,
  isVendedor,
}: CreateMovementDialogProps) {
  const createMovement = useCreateInventoryMovement();
  const { data: items, isLoading: itemsLoading } = useInventoryItems(open ? posConfigId : undefined);
  const [wasOpen, setWasOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateMovementFormValues>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const type = watch("type");
  const isVendorEntrada = isVendedor && type === "ENTRADA";

  // Mismo criterio de "ajuste de estado durante el render" que
  // CreateUserModal — reinicia formulario + mutación cada vez que el
  // modal pasa de cerrado a abierto.
  if (open && !wasOpen) {
    setWasOpen(true);
    reset(DEFAULT_VALUES);
    createMovement.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) onOpenChange(false);
  }

  function onSubmit(values: CreateMovementFormValues) {
    createMovement.mutate(
      { posConfigId, ...values, note: values.note?.trim() || undefined },
      { onSuccess: () => setTimeout(() => onOpenChange(false), 1200) },
    );
  }

  const errorMessage = (createMovement.error as ApiError | null)?.message;
  const sortedItems = [...(items ?? [])].sort((a, b) => a.productName.localeCompare(b.productName));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Registrar movimiento</DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            Merma, regalía, degustación o entrada{storeName ? ` en ${storeName}` : ""}.{" "}
            {isVendorEntrada
              ? "Queda como solicitud — cuando llegue, márcala como recibida e ingresa la cantidad real."
              : isVendedor
                ? "Queda pendiente hasta que Admin o Finanzas lo confirme."
                : "Se aplica de inmediato al inventario estimado."}
          </DialogDescription>
        </DialogHeader>

        {createMovement.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            {isVendorEntrada
              ? "Solicitud registrada — notifícale a Admin o Finanzas para que gestione el envío."
              : isVendedor
                ? "Movimiento registrado — queda pendiente de confirmación."
                : "Movimiento registrado correctamente."}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movement-product">Producto</Label>
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(next) => field.onChange(Number(next))}
                  >
                    <SelectTrigger id="movement-product" className="w-full">
                      <SelectValue placeholder={itemsLoading ? "Cargando..." : "Selecciona un producto"} />
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
              <Label htmlFor="movement-type">Motivo</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="movement-type" className="w-full">
                      <SelectValue placeholder="Selecciona un motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <option.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movement-quantity">Cantidad</Label>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <Input
                    id="movement-quantity"
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
              <Label htmlFor="movement-note">Nota (opcional)</Label>
              <Controller
                control={control}
                name="note"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="movement-note"
                    placeholder="Ej. producto dañado, cliente VIP, prueba de sabor nuevo..."
                  />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMovement.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Registrando...
                  </>
                ) : (
                  "Registrar movimiento"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
