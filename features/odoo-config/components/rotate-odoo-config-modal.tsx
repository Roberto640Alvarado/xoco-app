"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRotateOdooConfig } from "../hooks/use-rotate-odoo-config";
import { rotateOdooConfigSchema, type RotateOdooConfigFormValues } from "../schemas/rotate-odoo-config.schema";

const DEFAULT_VALUES: RotateOdooConfigFormValues = { apiKey: "", uid: 0, durationDays: 30 };

interface RotateOdooConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Con una key activa el modal rota; sin ella, registra la primera. */
  hasActiveKey: boolean;
}

// Modal para agregar una API key de Odoo. La nueva pasa a ser la activa y la
// anterior queda en el historial (ver OdooConfigHistory). Mismo patrón que
// CreateUserModal: Dialog controlado desde afuera, reinicio al abrir y
// auto-cierre tras el éxito.
export function RotateOdooConfigModal({ open, onOpenChange, hasActiveKey }: RotateOdooConfigModalProps) {
  const rotate = useRotateOdooConfig();
  const [wasOpen, setWasOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RotateOdooConfigFormValues>({
    resolver: zodResolver(rotateOdooConfigSchema),
    defaultValues: DEFAULT_VALUES,
  });

  if (open && !wasOpen) {
    setWasOpen(true);
    reset(DEFAULT_VALUES);
    rotate.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function onSubmit(values: RotateOdooConfigFormValues) {
    rotate.mutate(values, { onSuccess: () => setTimeout(() => onOpenChange(false), 1200) });
  }

  const errorMessage = rotate.error?.message;
  const title = hasActiveKey ? "Rotar API key" : "Agregar API key";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <div className="pt-0.5">
              <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
              <DialogDescription className="pt-1 leading-relaxed">
                La nueva key pasa a ser la activa y la anterior queda en el historial.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {rotate.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
            API key guardada correctamente.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {errorMessage && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="apiKey">API key</Label>
              <Controller
                control={control}
                name="apiKey"
                render={({ field }) => (
                  <Input {...field} id="apiKey" type="password" autoComplete="off" placeholder="5c3c7480..." />
                )}
              />
              {errors.apiKey && <p className="text-xs text-destructive">{errors.apiKey.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="uid">uid de Odoo</Label>
                <Controller
                  control={control}
                  name="uid"
                  render={({ field }) => <Input {...field} id="uid" type="number" min={1} />}
                />
                {errors.uid && <p className="text-xs text-destructive">{errors.uid.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="durationDays">Duración (días)</Label>
                <Controller
                  control={control}
                  name="durationDays"
                  render={({ field }) => <Input {...field} id="durationDays" type="number" min={1} />}
                />
                {errors.durationDays && <p className="text-xs text-destructive">{errors.durationDays.message}</p>}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">El uid es el id del usuario de Odoo dueño de la key.</p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={rotate.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={rotate.isPending}>
                {rotate.isPending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  "Guardar API key"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
