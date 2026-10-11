import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  /** Una frase corta: qué es esta pantalla o qué puedes hacer en ella. */
  description: string;
  /** Botones y selectores de la sección. */
  children?: ReactNode;
  /** Con muchos controles (ej. filtros de fechas): van debajo del título en
   * una fila propia en vez de a la derecha. */
  stacked?: boolean;
  /** Ancla para el tour guiado (data-tour). */
  tourId?: string;
  className?: string;
}

/**
 * Card de encabezado de una pantalla: ícono, título, una frase corta y los
 * botones de la sección a la derecha (o debajo si `stacked`). Reemplaza a
 * FilterToolbar en las pantallas de Inventario.
 */
export function SectionCard({ icon: Icon, title, description, children, stacked = false, tourId, className }: SectionCardProps) {
  return (
    <section
      data-tour={tourId}
      className={cn(
        "rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-4 shadow-xs sm:p-5",
        stacked ? "flex flex-col gap-4" : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            stacked && "border-t border-border pt-4",
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
