"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { useCreateInventoryMovement } from "../hooks/use-create-inventory-movement";
import { createMovementSchema, type CreateMovementFormValues } from "../schemas/create-movement.schema";
import type { ApiError } from "@/lib/api/client";

type ManualType = CreateMovementFormValues["type"];

interface TypeOption {
  value: ManualType;
  label: string;
  hint: string;
  icon: typeof PackageX;
  placeholder: string;
}

// ENTRADA suma; las otras tres restan. Botones grandes en vez de un select:
// quien llena el formulario casi no usa laptop.
const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "ENTRADA",
    label: "Entrada",
    hint: "Llegó producto",
    icon: ArrowDownToLine,
    placeholder: "Ej. bombones que trajeron de planta, pedido de proveedor...",
  },
  {
    value: "MERMA",
    label: "Merma",
    hint: "Se dañó o perdió",
    icon: PackageX,
    placeholder: "Ej. se cayó, venció, se derritió...",
  },
  {
    value: "REGALIA",
    label: "Regalía",
    hint: "Se regaló",
    icon: Gift,
    placeholder: "Ej. cliente frecuente, cortesía...",
  },
  {
    value: "DEGUSTACION",
    label: "Degustación",
    hint: "Se dio a probar",
    icon: Cookie,
    placeholder: "Ej. muestra para clientes, sabor nuevo...",
  },
];

export type { ManualType as ManualMovementType };

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
  /** Motivo ya elegido al abrir (ej. el botón "Registrar entrada"). */
  initialType?: ManualType;
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
  initialType,
}: CreateMovementDialogProps) {
  const createMovement = useCreateInventoryMovement();
  const { data: items, isLoading: itemsLoading } = useInventoryItems(open ? posConfigId : undefined);
  const [wasOpen, setWasOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMovementFormValues>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: DEFAULT_VALUES,
  });


  // Mismo criterio de "ajuste de estado durante el render" que
  // CreateUserModal — reinicia formulario + mutación cada vez que el
  // modal pasa de cerrado a abierto.
  if (open && !wasOpen) {
    setWasOpen(true);
    reset({ ...DEFAULT_VALUES, type: initialType });
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

  const selectedType = useWatch({ control, name: "type" });
  const selected = TYPE_OPTIONS.find((option) => option.value === selectedType);
  const isEntry = selectedType === "ENTRADA";

  const errorMessage = (createMovement.error as ApiError | null)?.message;
  const sortedItems = [...(items ?? [])].sort((a, b) => a.productName.localeCompare(b.productName));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEntry ? "Registrar entrada" : "Registrar movimiento"}
          </DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            {isEntry
              ? `Producto que llegó${storeName ? ` a ${storeName}` : ""} sin una solicitud. Se suma a lo que ya hay; no borra el conteo.`
              : `Lo que entra o sale${storeName ? ` de ${storeName}` : ""}.`}{" "}
            {isVendedor
              ? "Queda pendiente hasta que Admin o Finanzas lo confirme."
              : "Se aplica de inmediato al inventario estimado."}
          </DialogDescription>
        </DialogHeader>

        {createMovement.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            {isVendedor
              ? `${isEntry ? "Entrada registrada" : "Movimiento registrado"}. Queda pendiente de confirmación.`
              : isEntry
                ? "Entrada registrada. Ya se sumó al inventario."
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
              <Label id="movement-type-label">¿Qué pasó?</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <div role="radiogroup" aria-labelledby="movement-type-label" className="grid grid-cols-2 gap-2">
                    {TYPE_OPTIONS.map((option) => {
                      const active = field.value === option.value;
                      const entry = option.value === "ENTRADA";
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? entry
                                ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                                : "border-primary bg-primary/10 ring-1 ring-primary"
                              : "border-border bg-card hover:bg-muted/60",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              entry ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
                            )}
                          >
                            <option.icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="text-sm font-semibold text-foreground">{option.label}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {entry ? "＋ " : "− "}
                              {option.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movement-quantity">
                {isEntry ? "¿Cuánto llegó?" : selectedType ? "¿Cuánto salió?" : "Cantidad"}
              </Label>
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
                    placeholder={selected?.placeholder ?? "Ej. producto dañado, cliente VIP, prueba de sabor nuevo..."}
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
                ) : isEntry ? (
                  "Registrar entrada"
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
