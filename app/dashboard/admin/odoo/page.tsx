"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOdooConfig } from "@/features/odoo-config/hooks/use-odoo-config";
import { useRotateOdooConfig } from "@/features/odoo-config/hooks/use-rotate-odoo-config";
import {
  rotateOdooConfigSchema,
  type RotateOdooConfigFormValues,
} from "@/features/odoo-config/schemas/rotate-odoo-config.schema";
import { formatLongDate } from "@/lib/format";
import type { ApiError } from "@/lib/api/client";

export default function OdooConfigPage() {
  const { data: config, isLoading } = useOdooConfig();
  const rotate = useRotateOdooConfig();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RotateOdooConfigFormValues>({
    resolver: zodResolver(rotateOdooConfigSchema),
    defaultValues: { apiKey: "", uid: 0, durationDays: 30 },
  });

  function onSubmit(values: RotateOdooConfigFormValues) {
    rotate.mutate(values, { onSuccess: () => reset({ apiKey: "", uid: 0, durationDays: 30 }) });
  }

  const errorMessage = (rotate.error as ApiError | null)?.message;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Integración con Odoo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El API key nunca se guarda en variables de entorno — vive en Mongo (colección
          <code className="mx-1 rounded bg-muted px-1 py-0.5">odoo_config</code>)
          y solo un SUPER_ADMIN puede rotarla desde aquí.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-foreground">Estado actual</h2>
        {isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        ) : !config ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            No hay ningún API key configurado todavía.
          </p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">API key</dt>
            <dd className="font-mono text-foreground">{config.apiKeyMasked}</dd>

            <dt className="text-muted-foreground">uid de Odoo</dt>
            <dd className="text-foreground">{config.uid}</dd>

            <dt className="text-muted-foreground">Duración</dt>
            <dd className="text-foreground">{config.durationDays} días</dd>

            <dt className="text-muted-foreground">Expira</dt>
            <dd className="flex items-center gap-1.5 text-foreground">
              {config.isExpired ? (
                <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
              {formatLongDate(config.expiresAt.slice(0, 10))}
              {config.isExpired && <span className="text-destructive">(vencido)</span>}
            </dd>
          </dl>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-foreground">
          {config ? "Rotar API key" : "Registrar API key"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Reemplaza la key activa (o crea la primera). El uid es el id del usuario de Odoo
          dueño de esta key — execute_kw lo pide siempre junto con ella.
        </p>

        {rotate.isSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            API key actualizada correctamente.
          </div>
        )}
        {errorMessage && (
          <div role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4" noValidate>
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

          <div className="grid grid-cols-2 gap-4">
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
              {errors.durationDays && (
                <p className="text-xs text-destructive">{errors.durationDays.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={rotate.isPending} className="w-fit">
            {rotate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : config ? (
              "Rotar API key"
            ) : (
              "Registrar API key"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
