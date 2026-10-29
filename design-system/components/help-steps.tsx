import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "cn";

export interface HelpStep {
  icon: LucideIcon;
  title: string;
  text: string;
}

interface HelpStepsProps {
  steps: HelpStep[];
  /** Paso en el que va la persona (0-based). Los anteriores salen con ✓. */
  currentIndex: number;
  className?: string;
}

/**
 * Guía de "qué hago ahora" en pasos grandes y numerados, con ícono, título
 * corto y una frase. Pensada para personas que casi no usan computadora: el
 * paso actual se resalta y los terminados llevan ✓ (no depende solo del
 * color). En móvil solo se ve el paso actual completo.
 */
export function HelpSteps({ steps, currentIndex, className }: HelpStepsProps) {
  return (
    <ol className={cn("grid gap-2 sm:grid-cols-3", className)} aria-label="Pasos">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        const Icon = step.icon;
        return (
          <li
            key={step.title}
            aria-current={current ? "step" : undefined}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
              current && "border-primary bg-primary/5 shadow-sm",
              done && "border-emerald-500/40 bg-emerald-500/5",
              !current && !done && "border-border bg-card opacity-70",
              !current && "max-sm:hidden",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                current && "bg-primary text-primary-foreground",
                done && "bg-emerald-500 text-white",
                !current && !done && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {step.title}
              </span>
              <span className="block text-xs leading-snug text-muted-foreground">{step.text}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
