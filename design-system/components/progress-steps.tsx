import { Check, X } from "lucide-react";
import { cn } from "cn";

export interface ProgressStep {
  key: string;
  label: string;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  /** Índice del paso actual (0-based). Los anteriores se marcan como hechos. -1 = ninguno aún. */
  currentIndex: number;
  /** El proceso terminó mal (ej. cancelada): el paso actual se pinta en rojo. */
  failed?: boolean;
  /** Versión compacta (solo puntos y línea, sin etiquetas) para tarjetas. */
  compact?: boolean;
  className?: string;
}

/**
 * Línea de pasos de un proceso (Solicitada → En preparación → En camino →
 * Recibida). Hechos en verde, actual resaltado, pendientes en gris. El
 * estado se repite con texto/ícono para no depender solo del color.
 */
export function ProgressSteps({ steps, currentIndex, failed = false, compact = false, className }: ProgressStepsProps) {
  return (
    <ol className={cn("flex w-full items-start", className)} aria-label="Avance">
      {steps.map((step, index) => {
        const done = index < currentIndex || (index === currentIndex && !failed && index === steps.length - 1);
        const current = index === currentIndex && !done;
        const isLast = index === steps.length - 1;
        return (
          <li key={step.key} className={cn("flex min-w-0 items-start", !isLast && "flex-1")} aria-current={current ? "step" : undefined}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                  compact ? "size-4" : "size-6",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  current && !failed && "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                  current && failed && "border-destructive bg-destructive/10 text-destructive ring-4 ring-destructive/15",
                  !done && !current && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className={compact ? "size-2.5" : "size-3.5"} aria-hidden="true" />
                ) : current && failed ? (
                  <X className={compact ? "size-2.5" : "size-3.5"} aria-hidden="true" />
                ) : compact ? null : (
                  index + 1
                )}
              </span>
              {!compact && (
                <span
                  className={cn(
                    "max-w-[5.5rem] text-center text-[11px] leading-tight",
                    current ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              )}
            </div>
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-1 mt-2 h-0.5 flex-1 rounded-full",
                  compact ? "mt-[7px]" : "mt-[11px]",
                  index < currentIndex ? "bg-emerald-500" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
