"use client";

import { useState, type ReactNode } from "react";
import { KeyRound, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoBadge } from "@/design-system/components/info-badge";
import { Panel } from "@/design-system/components/panel";
import { OdooConfigHistory } from "@/features/odoo-config/components/odoo-config-history";
import { RotateOdooConfigModal } from "@/features/odoo-config/components/rotate-odoo-config-modal";
import { useOdooConfig } from "@/features/odoo-config/hooks/use-odoo-config";
import { ReportHeader } from "@/features/page-guide/components/report-header";
import { formatLongDate } from "@/lib/format";

function StatusItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Una key por vencer es la que expira en una semana o menos.
const EXPIRING_SOON_DAYS = 7;

function daysUntil(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / DAY_MS);
}

function remainingLabel(days: number, expired: boolean): string {
  if (expired && days >= 0) return "Venció hoy";
  if (days < 0) return `Venció hace ${-days} ${-days === 1 ? "día" : "días"}`;
  if (days === 0) return "Vence hoy";
  return `Quedan ${days} ${days === 1 ? "día" : "días"}`;
}

export default function OdooConfigPage() {
  const { data: config, isLoading } = useOdooConfig();
  const [modalOpen, setModalOpen] = useState(false);

  const daysLeft = config ? daysUntil(config.expiresAt) : null;
  const expiringSoon = daysLeft !== null && !config?.isExpired && daysLeft <= EXPIRING_SOON_DAYS;

  const status = !config
    ? { tone: "neutral" as const, label: "Sin configurar" }
    : config.isExpired
      ? { tone: "danger" as const, label: "Vencida" }
      : expiringSoon
        ? { tone: "warning" as const, label: "Por vencer" }
        : { tone: "success" as const, label: "Vigente" };

  return (
    <div className="flex flex-col gap-4">
      <ReportHeader page="admin-odoo">
        <Button type="button" onClick={() => setModalOpen(true)}>
          <KeyRound aria-hidden="true" />
          Agregar API key
        </Button>
      </ReportHeader>

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !config ? (
          <p className="text-sm text-muted-foreground">Todavía no hay una API key. Agrégala con el botón de arriba.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatusItem label="API key">
              <span className="font-mono">{config.apiKeyMasked}</span>
            </StatusItem>
            <StatusItem label="uid de Odoo">{config.uid}</StatusItem>
            <StatusItem label="Duración">{config.durationDays} días</StatusItem>
            <StatusItem label="Expira">
              <span className={config.isExpired ? "text-destructive" : undefined}>
                {formatLongDate(config.expiresAt.slice(0, 10))}
              </span>
              {daysLeft !== null && (
                <span
                  className={`mt-0.5 block text-xs font-normal ${
                    config.isExpired
                      ? "text-destructive"
                      : expiringSoon
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-muted-foreground"
                  }`}
                >
                  {remainingLabel(daysLeft, config.isExpired)}
                </span>
              )}
            </StatusItem>
          </dl>
        )}
      </Panel>

      <OdooConfigHistory />

      <RotateOdooConfigModal open={modalOpen} onOpenChange={setModalOpen} hasActiveKey={Boolean(config)} />
    </div>
  );
}
