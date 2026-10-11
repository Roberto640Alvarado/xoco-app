"use client";

import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound, Loader2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoBadge } from "@/design-system/components/info-badge";
import { NoticeCard } from "@/design-system/components/notice-card";
import { Panel } from "@/design-system/components/panel";
import { ReportHeader } from "@/features/page-guide/components/report-header";
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

  const status = !config
    ? { tone: "neutral" as const, label: "Sin configurar" }
    : config.isExpired
      ? { tone: "danger" as const, label: "Vencido" }
      : { tone: "success" as const, label: "Vigente" };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <ReportHeader page="admin-odoo" />

      <Panel
        title="Estado actual"
        description="La key que usa el panel para traer datos de Odoo."
        icon={Plug}
        badge={
          isLoading ? undefined : (
            <InfoBadge tone={status.tone} size="sm" dot>
              {status.label}
            </InfoBadge>
          )
        }
      >
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !config ? (
          <p className="text-sm text-muted-foreground">Todavía no hay una API key. Regístrala abajo.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatusItem label="API key">
              <span className="font-mono">{config.apiKeyMasked}</span>
            </StatusItem>
            <StatusItem label="uid de Odoo">{config.uid}</StatusItem>
            <StatusItem label="Duración">{config.durationDays} días</StatusItem>
            <StatusItem label="Expira">
              <span className={config.isExpired ? "text-destructive" : undefined}>
                {formatLongDate(config.expiresAt.slice(0, 10))}
              </span>
            </StatusItem>
          </dl>
        )}
      </Panel>

      <Panel
        title={config ? "Rotar API key" : "Registrar API key"}
        description="Reemplaza la key activa. El uid es el id del usuario de Odoo dueño de la key."
        icon={KeyRound}
      >
        {rotate.isSuccess && (
          <NoticeCard tone="success" icon={CheckCircle2} title="API key actualizada" description="El panel ya usa la nueva key." className="mb-4" />
        )}
        {errorMessage && (
          <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
      </Panel>
    </div>
  );
}

function StatusItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}
