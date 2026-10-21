import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangeIndicator } from "./change-indicator";

interface ComparisonStatProps {
  label: string;
  icon?: LucideIcon;
  /** Valor del período principal (A), ya formateado. */
  value: string;
  /** Nombre corto del período A (ej. "Octubre 2026 (al 20)"). */
  valueLabel: string;
  /** Valor del período comparado (B), ya formateado. */
  compareValue: string;
  /** Nombre corto del período B (ej. "Septiembre 2026"). */
  compareLabel: string;
  change: { diff: number; pct: number | null };
  isLoading?: boolean;
  /** La query falló: guion en vez de un "0" que parezca un dato real. */
  isError?: boolean;
}

function PeriodTag({ color, children }: { color: string; children: string }) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </p>
  );
}

/**
 * Tarjeta de número con comparación: cada valor lleva el nombre de su
 * período y el mismo punto de color que la gráfica (azul = período A, gris =
 * período B). El principal va en grande con su cambio; el comparado, debajo
 * y más chico. Misma forma que StatTile para convivir en la misma fila.
 */
export function ComparisonStat({
  label,
  icon: Icon,
  value,
  valueLabel,
  compareValue,
  compareLabel,
  change,
  isLoading,
  isError,
}: ComparisonStatProps) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_28px_-10px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      ) : isError ? (
        <p className="text-2xl font-semibold text-muted-foreground" aria-label="Sin dato">
          —
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <PeriodTag color="var(--color-chart-1)">{valueLabel}</PeriodTag>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
              <ChangeIndicator diff={change.diff} pct={change.pct} />
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
            <PeriodTag color="var(--color-chart-2)">{compareLabel}</PeriodTag>
            <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">{compareValue}</p>
          </div>
        </>
      )}
    </div>
  );
}
