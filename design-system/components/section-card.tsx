import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

interface SectionCardBaseProps {
  /** Botones y selectores de la sección. */
  children?: ReactNode;
  /** Ancla para el tour guiado (data-tour). */
  tourId?: string;
  className?: string;
  /** Fuerza los controles en una sola línea desde `lg` (el texto se acorta en vez de bajar los botones). */
  singleLineControls?: boolean;
}

interface SectionCardWithHeaderProps extends SectionCardBaseProps {
  icon: LucideIcon;
  title: string;
  /** Una frase corta: qué es esta pantalla o qué puedes hacer en ella. */
  description: string;
  controlsOnly?: false;
}

interface SectionCardControlsOnlyProps extends SectionCardBaseProps {
  /** Cuando hay varios controles (filtros de fechas, producto, tipo...): la
   * card muestra solo esa fila, sin ícono, título ni frase. */
  controlsOnly: true;
}

type SectionCardProps = SectionCardWithHeaderProps | SectionCardControlsOnlyProps;

/**
 * Card de encabezado de una pantalla: ícono, título, una frase corta y los
 * botones de la sección a la derecha. Con `controlsOnly` (varios controles)
 * queda solo la fila de controles. Es el encabezado de todas las pantallas de
 * Inventario.
 */
export function SectionCard(props: SectionCardProps) {
  const { children, tourId, className, singleLineControls = false } = props;

  if (props.controlsOnly) {
    return (
      <section
        data-tour={tourId}
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-3 shadow-xs sm:p-4",
          className,
        )}
      >
        {children}
      </section>
    );
  }

  const { icon: Icon, title, description } = props;
  return (
    <section
      data-tour={tourId}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className,
      )}
    >
      <div className={cn("flex min-w-0 items-center gap-3.5", singleLineControls && "lg:flex-1")}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && (
        <div className={cn("flex flex-wrap items-center gap-2", singleLineControls && "lg:shrink-0 lg:flex-nowrap")}>{children}</div>
      )}
    </section>
  );
}
