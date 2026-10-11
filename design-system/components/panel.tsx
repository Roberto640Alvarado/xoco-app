import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

interface PanelProps {
  /** Sin título, el panel es solo el contenedor. */
  title?: string;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Badge junto al título (ej. un estado). */
  badge?: ReactNode;
  /** Botón a la derecha del encabezado. */
  action?: ReactNode;
  /** Sin padding en el cuerpo: para tablas y listas que llegan al borde. */
  flush?: boolean;
  /** Ancla para el tour guiado (data-tour). */
  tourId?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Panel de contenido: la card donde viven formularios, listas y tablas de una
 * pantalla. Encabezado con título, descripción corta, badge y botón; cuerpo
 * con padding (o `flush` para tablas y listas). Es el hermano de `SectionCard`,
 * que va arriba de la pantalla.
 */
export function Panel({ title, description, icon: Icon, badge, action, flush = false, tourId, className, children }: PanelProps) {
  return (
    <section data-tour={tourId} className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-xs", className)}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {badge}
              </div>
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={flush ? undefined : "p-5"}>{children}</div>
    </section>
  );
}
